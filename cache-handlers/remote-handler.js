// Custom 'use cache: remote' handler backed by Neon Postgres, wired up in
// next.config.ts (cacheHandlers.remote). Netlify's Next adapter does not
// provide a durable remote cache handler out of the box — without this file,
// 'use cache: remote' silently falls back to per-instance in-memory caching,
// which defeats the whole point on serverless. See cache_entries/cache_tags
// in src/lib/db/migrations/0002_cache_handler.ts for the schema.
//
// Kept as a standalone CommonJS module (per Next's documented convention)
// with its own `pg` connection, independent of the app's Kysely/Neon-serverless
// pool in src/lib/db, since it's loaded outside the normal app module graph.

const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(text, params) {
	const result = await pool.query(text, params)
	return result.rows
}

async function streamToBase64(stream) {
	const reader = stream.getReader()
	const chunks = []
	try {
		for (;;) {
			const { done, value } = await reader.read()
			if (done) break
			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}
	return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('base64')
}

function base64ToStream(base64) {
	const buffer = Buffer.from(base64, 'base64')
	return new ReadableStream({
		start(controller) {
			controller.enqueue(new Uint8Array(buffer))
			controller.close()
		},
	})
}

async function getExpiration(tags) {
	if (!tags || tags.length === 0) return 0
	const rows = await query('SELECT MAX(revalidated_at) AS max FROM cache_tags WHERE tag = ANY($1)', [tags])
	const max = rows[0]?.max
	return max ? Number(max) : 0
}

module.exports = {
	async get(cacheKey, softTags) {
		try {
			const rows = await query(
				'SELECT value, tags, stale, timestamp, expire, revalidate FROM cache_entries WHERE cache_key = $1',
				[cacheKey],
			)
			const entry = rows[0]
			if (!entry) return undefined

			const timestamp = Number(entry.timestamp)
			const now = Date.now()
			if (now > timestamp + entry.revalidate * 1000) return undefined

			const allTags = [...(entry.tags ?? []), ...(softTags ?? [])]
			if (allTags.length > 0) {
				const mostRecentRevalidation = await getExpiration(allTags)
				if (mostRecentRevalidation > timestamp) return undefined
			}

			return {
				value: base64ToStream(entry.value),
				tags: entry.tags ?? [],
				stale: entry.stale,
				timestamp,
				expire: entry.expire,
				revalidate: entry.revalidate,
			}
		} catch (err) {
			console.error('[remote-cache] get failed', err)
			return undefined
		}
	},

	async set(cacheKey, pendingEntry) {
		try {
			const entry = await pendingEntry
			const value = await streamToBase64(entry.value)

			await query(
				`INSERT INTO cache_entries (cache_key, value, tags, stale, timestamp, expire, revalidate)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)
				 ON CONFLICT (cache_key) DO UPDATE SET
				 	value = EXCLUDED.value,
				 	tags = EXCLUDED.tags,
				 	stale = EXCLUDED.stale,
				 	timestamp = EXCLUDED.timestamp,
				 	expire = EXCLUDED.expire,
				 	revalidate = EXCLUDED.revalidate`,
				[
					cacheKey,
					value,
					entry.tags ?? [],
					entry.stale,
					// entry.timestamp can carry sub-millisecond precision (e.g. performance.now()
					// based), which a bigint column rejects as invalid input syntax.
					Math.round(entry.timestamp),
					entry.expire,
					entry.revalidate,
				],
			)

			// Opportunistically prune hard-expired rows instead of running a cron job.
			if (Math.random() < 0.01) {
				query('DELETE FROM cache_entries WHERE timestamp + expire * 1000 < $1', [Date.now()]).catch((err) =>
					console.error('[remote-cache] prune failed', err),
				)
			}
		} catch (err) {
			// Per Next's cacheHandlers contract: the response is already served by
			// the time set() runs, so swallow the failure — the entry is just lost
			// and the next request triggers a fresh render.
			console.error('[remote-cache] set failed', err)
		}
	},

	async refreshTags() {
		// No local tag cache to sync — getExpiration() queries Postgres directly.
	},

	getExpiration,

	async updateTags(tags) {
		if (!tags || tags.length === 0) return
		const now = Date.now()
		await query(
			`INSERT INTO cache_tags (tag, revalidated_at)
			 SELECT unnest($1::text[]), $2
			 ON CONFLICT (tag) DO UPDATE SET revalidated_at = EXCLUDED.revalidated_at`,
			[tags, now],
		)
	},
}
