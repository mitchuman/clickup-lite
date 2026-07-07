import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { TaskRow } from '@/components/ui/task-row'
import { getUserTasks } from '@/lib/clickup/cached'
import { isSameUtcDay } from '@/lib/date'

export async function TodayTasks({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const now = new Date()
	const today = tasks.filter(
		(task) => task.dueDate !== null && task.status.type !== 'closed' && isSameUtcDay(task.dueDate, now),
	)

	return (
		<Card>
			<CardTitle>Today · {today.length}</CardTitle>
			{today.length === 0 ? (
				<EmptyState>Nothing due today.</EmptyState>
			) : (
				<ul>
					{today.map((task) => (
						<TaskRow key={task.id} taskId={task.id} name={task.name} meta={task.listName} statusType={task.status.type} />
					))}
				</ul>
			)}
		</Card>
	)
}
