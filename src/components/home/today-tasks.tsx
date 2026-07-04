import Link from 'next/link'
import { getUserTasks } from '@/lib/clickup/cached'
import { isSameUtcDay } from '@/lib/date'

export async function TodayTasks({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const now = new Date()
	const today = tasks.filter(
		(task) => task.dueDate !== null && task.status.type !== 'closed' && isSameUtcDay(task.dueDate, now),
	)

	return (
		<section>
			<h2>Today ({today.length})</h2>
			{today.length === 0 ? (
				<p>Nothing due today.</p>
			) : (
				<ul>
					{today.map((task) => (
						<li key={task.id}>
							<Link href={`/task/${task.id}`}>{task.name}</Link> — {task.listName}
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
