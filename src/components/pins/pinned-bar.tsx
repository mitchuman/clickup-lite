import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { PinnedBarClient } from './pinned-bar-client'

// Cheap indexed Postgres read, no 'use cache' — pins must reflect the user's
// latest toggles on full page loads. Renders into its own Suspense boundary in
// the (app) layout so it never blocks the shell.
export async function PinnedBar() {
	const user = await requireUser()
	const rows = await db
		.selectFrom('pinned_tasks')
		.select(['clickup_task_id', 'task_name'])
		.where('user_id', '=', user.userId)
		.orderBy('position')
		.orderBy('pinned_at')
		.execute()

	return <PinnedBarClient initialPins={rows.map((row) => ({ taskId: row.clickup_task_id, taskName: row.task_name }))} />
}
