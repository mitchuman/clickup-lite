import { db } from '@/lib/db'

// Reads directly from Postgres (no 'use cache') — it's a cheap indexed query
// and needs to reflect webhook-driven notifications immediately.
export async function Inbox({ clickupUserId }: { clickupUserId: string }) {
	const notifications = await db
		.selectFrom('notifications')
		.selectAll()
		.where('clickup_user_id', '=', clickupUserId)
		.where('read_at', 'is', null)
		.orderBy('created_at', 'desc')
		.limit(20)
		.execute()

	return (
		<section>
			<h2>Inbox ({notifications.length})</h2>
			{notifications.length === 0 ? (
				<p>You're all caught up.</p>
			) : (
				<ul>
					{notifications.map((notification) => (
						<li key={notification.id}>
							{notification.actor ?? 'Someone'} — {notification.type} —{' '}
							{notification.task_name ?? notification.clickup_task_id}
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
