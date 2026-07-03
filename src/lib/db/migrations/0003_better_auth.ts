import { type Kysely, sql } from 'kysely'

// Generated via `bunx @better-auth/cli generate --config src/lib/auth.ts` and
// folded into our own numbered migration so schema versioning has one source
// of truth instead of a second, disconnected better-auth migration flow.
export async function up(db: Kysely<any>): Promise<void> {
	await sql`
		create table "user" (
			"id" text not null primary key,
			"name" text not null,
			"email" text not null unique,
			"emailVerified" boolean not null,
			"image" text,
			"createdAt" timestamptz default CURRENT_TIMESTAMP not null,
			"updatedAt" timestamptz default CURRENT_TIMESTAMP not null
		)
	`.execute(db)

	await sql`
		create table "session" (
			"id" text not null primary key,
			"expiresAt" timestamptz not null,
			"token" text not null unique,
			"createdAt" timestamptz default CURRENT_TIMESTAMP not null,
			"updatedAt" timestamptz not null,
			"ipAddress" text,
			"userAgent" text,
			"userId" text not null references "user" ("id") on delete cascade
		)
	`.execute(db)

	await sql`
		create table "account" (
			"id" text not null primary key,
			"accountId" text not null,
			"providerId" text not null,
			"userId" text not null references "user" ("id") on delete cascade,
			"accessToken" text,
			"refreshToken" text,
			"idToken" text,
			"accessTokenExpiresAt" timestamptz,
			"refreshTokenExpiresAt" timestamptz,
			"scope" text,
			"password" text,
			"createdAt" timestamptz default CURRENT_TIMESTAMP not null,
			"updatedAt" timestamptz not null
		)
	`.execute(db)

	await sql`
		create table "verification" (
			"id" text not null primary key,
			"identifier" text not null,
			"value" text not null,
			"expiresAt" timestamptz not null,
			"createdAt" timestamptz default CURRENT_TIMESTAMP not null,
			"updatedAt" timestamptz default CURRENT_TIMESTAMP not null
		)
	`.execute(db)

	await sql`create index "session_userId_idx" on "session" ("userId")`.execute(db)
	await sql`create index "account_userId_idx" on "account" ("userId")`.execute(db)
	await sql`create index "verification_identifier_idx" on "verification" ("identifier")`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('verification').execute()
	await db.schema.dropTable('account').execute()
	await db.schema.dropTable('session').execute()
	await db.schema.dropTable('user').execute()
}
