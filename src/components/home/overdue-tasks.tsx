import Link from 'next/link'
import { getUserTasks } from '@/lib/clickup/cached'
import { startOfTodayMs } from '@/lib/date'

export async function OverdueTasks({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const todayStart = startOfTodayMs()
	const overdue = tasks.filter(
		(task) => task.dueDate !== null && task.status.type !== 'closed' && task.dueDate < todayStart,
	)

	return (
		<section>
			<h2>Overdue ({overdue.length})</h2>
			{overdue.length === 0 ? (
				<p>Nothing overdue.</p>
			) : (
				<ul>
					{overdue.map((task) => (
						<li key={task.id}>
							<Link href={`/task/${task.id}`}>{task.name}</Link> — {task.listName}
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
