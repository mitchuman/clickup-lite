import { Suspense } from 'react'
import { DashboardHeader } from '@/components/shell/dashboard-header'
import { Inbox } from '@/components/home/inbox'
import { OverdueTasks } from '@/components/home/overdue-tasks'
import { TimeLogged } from '@/components/home/time-logged'
import { TodayTasks } from '@/components/home/today-tasks'
import { WeekLoad } from '@/components/home/week-load'
import { CardSkeleton } from '@/components/ui/skeleton'
import { requireUser } from '@/lib/session'

export default async function HomePage() {
	const user = await requireUser()

	return (
		<main>
			<DashboardHeader name={user.name} />
			<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<div className="space-y-4">
				<Suspense fallback={<CardSkeleton title="Today" />}>
					<TodayTasks clickupUserId={user.clickupUserId} />
				</Suspense>
				<Suspense fallback={<CardSkeleton title="Overdue" />}>
					<OverdueTasks clickupUserId={user.clickupUserId} />
				</Suspense>
				<Suspense fallback={<CardSkeleton title="Logged today" rows={2} />}>
					<TimeLogged clickupUserId={user.clickupUserId} />
				</Suspense>
				<Suspense fallback={<CardSkeleton title="Inbox" rows={2} />}>
					<Inbox clickupUserId={user.clickupUserId} />
				</Suspense>
			</div>
			<div>
				<Suspense fallback={<CardSkeleton title="This week" rows={6} />}>
					<WeekLoad clickupUserId={user.clickupUserId} />
				</Suspense>
			</div>
		</div>
		</main>
	)
}
