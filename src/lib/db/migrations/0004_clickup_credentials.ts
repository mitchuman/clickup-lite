import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('clickup_credentials')
		.addColumn('user_id', 'text', (col) => col.primaryKey().references('user.id').onDelete('cascade'))
		.addColumn('clickup_user_id', 'text', (col) => col.notNull().unique())
		.addColumn('clickup_username', 'text', (col) => col.notNull())
		.addColumn('clickup_email', 'text')
		.addColumn('token_ciphertext', 'text', (col) => col.notNull())
		.addColumn('verified_at', 'timestamptz', (col) => col.notNull())
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('clickup_credentials').execute()
}
