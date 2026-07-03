import { Pool, neonConfig } from '@neondatabase/serverless'
import { Kysely, PostgresDialect, type PostgresDialectConfig } from 'kysely'
import ws from 'ws'
import { env } from '@/lib/env'
import type { Database } from './types'

// Cache Components requires the Node runtime, so we always talk to Neon over
// the WebSocket-based Pool (transaction support) rather than the HTTP driver.
neonConfig.webSocketConstructor = ws

const dialect = new PostgresDialect({
	// @neondatabase/serverless's Pool is structurally pg-compatible but its
	// types don't line up with kysely's minimal PostgresPool interface.
	pool: new Pool({ connectionString: env.databaseUrl }) as unknown as PostgresDialectConfig['pool'],
})

export const db = new Kysely<Database>({ dialect })
