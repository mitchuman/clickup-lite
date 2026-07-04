import Link from 'next/link'
import type { TaskSummary } from '@/lib/clickup/types'
import { getUserTasks } from '@/lib/clickup/cached'
import { startOfTodayMs } from '@/lib/date'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function WeekLoad({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const todayStart = startOfTodayMs()
	const weekEnd = todayStart + WEEK_MS

	const upcoming = tasks.filter(
		(task) => task.dueDate !== null && task.status.type !== 'closed' && task.dueDate >= todayStart && task.dueDate < weekEnd,
	)

	const byDay = new Map<string, TaskSummary[]>()
	for (const task of upcoming) {
		const day = new Date(task.dueDate as number).toISOString().slice(0, 10)
		const list = byDay.get(day) ?? []
		list.push(task)
		byDay.set(day, list)
	}
	const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))

	return (
		<section>
			<h2>This week ({upcoming.length})</h2>
			{days.length === 0 ? (
				<p>Nothing due this week.</p>
			) : (
				days.map(([day, dayTasks]) => (
					<div key={day}>
						<h3>{day}</h3>
						<ul>
							{dayTasks.map((task) => (
								<li key={task.id}>
									<Link href={`/task/${task.id}`}>{task.name}</Link> — {task.listName}
								</li>
							))}
						</ul>
					</div>
				))
			)}
		</section>
	)
}
