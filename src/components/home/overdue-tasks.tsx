import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { TaskRow } from '@/components/ui/task-row'
import { getUserTasks } from '@/lib/clickup/cached'
import { startOfTodayMs } from '@/lib/date'

export async function OverdueTasks({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const todayStart = startOfTodayMs()
	const overdue = tasks.filter(
		(task) => task.dueDate !== null && task.status.type !== 'closed' && task.dueDate < todayStart,
	)

	return (
		<Card className="border-l-4 border-l-red-400">
			<CardTitle className="text-red-500">Overdue · {overdue.length}</CardTitle>
			{overdue.length === 0 ? (
				<EmptyState>Nothing overdue.</EmptyState>
			) : (
				<ul>
					{overdue.map((task) => (
						<TaskRow
							key={task.id}
							taskId={task.id}
							name={task.name}
							meta={task.listName}
							statusType={task.status.type}
						/>
					))}
				</ul>
			)}
		</Card>
	)
}
