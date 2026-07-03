import { Suspense } from 'react'
import { Inbox } from '@/components/home/inbox'
import { OverdueTasks } from '@/components/home/overdue-tasks'
import { TimeLogged } from '@/components/home/time-logged'
import { TodayTasks } from '@/components/home/today-tasks'
import { WeekLoad } from '@/components/home/week-load'
import { requireUser } from '@/lib/session'

export default async function HomePage() {
	const user = await requireUser()

	return (
		<main>
			<h1>Home</h1>
			<Suspense fallback={<p>Loading today's tasks…</p>}>
				<TodayTasks clickupUserId={user.clickupUserId} />
			</Suspense>
			<Suspense fallback={<p>Loading overdue tasks…</p>}>
				<OverdueTasks clickupUserId={user.clickupUserId} />
			</Suspense>
			<Suspense fallback={<p>Loading this week's load…</p>}>
				<WeekLoad clickupUserId={user.clickupUserId} />
			</Suspense>
			<Suspense fallback={<p>Loading logged time…</p>}>
				<TimeLogged clickupUserId={user.clickupUserId} />
			</Suspense>
			<Suspense fallback={<p>Loading inbox…</p>}>
				<Inbox clickupUserId={user.clickupUserId} />
			</Suspense>
		</main>
	)
}
