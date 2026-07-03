import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { FileMigrationProvider, Migrator } from 'kysely/migration'
import { db } from '../src/lib/db'

async function migrateToLatest() {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(import.meta.dirname, '../src/lib/db/migrations'),
		}),
	})

	const { error, results } = await migrator.migrateToLatest()

	for (const result of results ?? []) {
		if (result.status === 'Success') {
			console.log(`migration "${result.migrationName}" executed successfully`)
		} else if (result.status === 'Error') {
			console.error(`failed to execute migration "${result.migrationName}"`)
		}
	}

	if (error) {
		console.error('migration run failed')
		console.error(error)
		process.exitCode = 1
	}

	await db.destroy()
}

migrateToLatest()
