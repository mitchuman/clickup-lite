import Link from 'next/link'
import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { db } from '@/lib/db'

const EVENT_LABELS: Record<string, string> = {
	taskCommentPosted: 'commented on',
	taskCommentUpdated: 'edited a comment on',
	taskAssigneeUpdated: 'assigned you to',
	taskStatusUpdated: 'changed the status of',
	taskDueDateUpdated: 'changed the due date of',
	taskPriorityUpdated: 'changed the priority of',
	taskCreated: 'created',
	taskUpdated: 'updated',
	taskMoved: 'moved',
}

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
		<Card>
			<CardTitle>Inbox · {notifications.length}</CardTitle>
			{notifications.length === 0 ? (
				<EmptyState>You&apos;re all caught up.</EmptyState>
			) : (
				<ul className="space-y-1">
					{notifications.map((notification) => (
						<li key={notification.id} className="py-0.5 text-sm text-zinc-600">
							<span className="font-medium text-zinc-800">{notification.actor ?? 'Someone'}</span>{' '}
							{EVENT_LABELS[notification.type] ?? notification.type}{' '}
							{notification.clickup_task_id ? (
								<Link
									href={`/task/${notification.clickup_task_id}`}
									className="font-medium text-accent-strong hover:underline"
								>
									{notification.task_name ?? notification.clickup_task_id}
								</Link>
							) : (
								(notification.task_name ?? 'a task')
							)}
						</li>
					))}
				</ul>
			)}
		</Card>
	)
}
