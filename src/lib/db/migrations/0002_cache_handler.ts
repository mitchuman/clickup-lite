import { type Kysely, sql } from 'kysely'

// Backs the custom 'use cache: remote' cache handler (cache-handlers/remote-handler.js).
// Kept in the same Neon database as everything else instead of adding Redis/Upstash.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('cache_entries')
		.addColumn('cache_key', 'text', (col) => col.primaryKey())
		.addColumn('value', 'text', (col) => col.notNull())
		.addColumn('tags', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
		.addColumn('stale', 'integer', (col) => col.notNull())
		.addColumn('timestamp', 'bigint', (col) => col.notNull())
		.addColumn('expire', 'integer', (col) => col.notNull())
		.addColumn('revalidate', 'integer', (col) => col.notNull())
		.execute()

	await db.schema
		.createTable('cache_tags')
		.addColumn('tag', 'text', (col) => col.primaryKey())
		.addColumn('revalidated_at', 'bigint', (col) => col.notNull())
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('cache_tags').execute()
	await db.schema.dropTable('cache_entries').execute()
}
