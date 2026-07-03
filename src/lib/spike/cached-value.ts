import { cacheLife, cacheTag } from 'next/cache'

// Temporary Phase 0 spike: proves 'use cache: remote' + the Neon-backed cache
// handler survive across separate Netlify function invocations. Remove once
// the real ClickUp cached data layer (src/lib/clickup/cached.ts) exists.
export async function getSpikeValue() {
	'use cache: remote'
	cacheTag('spike')
	cacheLife('days')

	return {
		id: crypto.randomUUID(),
		generatedAt: new Date().toISOString(),
	}
}
