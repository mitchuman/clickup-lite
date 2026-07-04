'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Pin/unpin lives entirely in our own Postgres (no ClickUp round trip). The UI
 * is optimistic via the zustand pins store; this just persists the new state.
 */
export async function togglePin(taskId: string, taskName: string): Promise<void> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error('Not authenticated')

	const deleted = await db
		.deleteFrom('pinned_tasks')
		.where('user_id', '=', session.user.id)
		.where('clickup_task_id', '=', taskId)
		.executeTakeFirst()

	if (deleted.numDeletedRows === BigInt(0)) {
		await db
			.insertInto('pinned_tasks')
			.values({ user_id: session.user.id, clickup_task_id: taskId, task_name: taskName })
			// A concurrent toggle already pinned it — that's the state we wanted.
			.onConflict((oc) => oc.columns(['user_id', 'clickup_task_id']).doNothing())
			.execute()
	}
}
