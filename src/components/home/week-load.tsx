import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { TaskRow } from '@/components/ui/task-row'
import type { TaskSummary } from '@/lib/clickup/types'
import { getUserTasks } from '@/lib/clickup/cached'
import { startOfTodayMs } from '@/lib/date'
import { WeekDayGroup } from './week-day-group'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function formatDay(isoDay: string): string {
	return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString('en-US', {
		timeZone: 'UTC',
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	})
}

export async function WeekLoad({ clickupUserId }: { clickupUserId: string }) {
	const tasks = await getUserTasks(clickupUserId)
	const todayStart = startOfTodayMs()
	const weekEnd = todayStart + WEEK_MS

	const upcoming = tasks.filter(
		(task) =>
			task.dueDate !== null && task.status.type !== 'closed' && task.dueDate >= todayStart && task.dueDate < weekEnd,
	)

	const byDay = new Map<string, TaskSummary[]>()
	for (const task of upcoming) {
		const day = new Date(task.dueDate as number).toISOString().slice(0, 10)
		const list = byDay.get(day) ?? []
		list.push(task)
		byDay.set(day, list)
	}
	const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
	const todayIso = new Date(todayStart).toISOString().slice(0, 10)

	return (
		<Card>
			<CardTitle>This week · {upcoming.length}</CardTitle>
			{days.length === 0 ? (
				<EmptyState>Nothing due this week.</EmptyState>
			) : (
				<div className="space-y-2">
					{days.map(([day, dayTasks]) => (
						<WeekDayGroup key={day} day={formatDay(day)} count={dayTasks.length} defaultOpen={day === todayIso}>
							<ul>
								{dayTasks.map((task) => (
									<TaskRow
										key={task.id}
										taskId={task.id}
										name={task.name}
										meta={task.listName}
										statusType={task.status.type}
									/>
								))}
							</ul>
						</WeekDayGroup>
					))}
				</div>
			)}
		</Card>
	)
}
