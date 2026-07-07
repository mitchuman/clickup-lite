import Link from 'next/link'
import type { ReactNode } from 'react'
import { CommandPalette } from '@/components/cmdk/command-palette'
import { PinnedBar } from '@/components/pins/pinned-bar'
import { PinsProvider } from '@/components/pins/pins-provider'
import { SearchTrigger } from '@/components/shell/search-trigger'
import { UserMenu } from '@/components/shell/user-menu'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'

// This gate is inherently a blocking, per-request check (we can't show
// protected content before we know who's asking) — so the whole (app)
// segment renders dynamically; inner content still streams via Suspense.
export const instant = false

export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await requireUser()

	// Cheap indexed query — bundled with the layout auth gate so PinButton and
	// the pinned bar have store state immediately (no Suspense waterfall).
	const pinRows = await db
		.selectFrom('pinned_tasks')
		.select(['clickup_task_id', 'task_name'])
		.where('user_id', '=', user.userId)
		.orderBy('position')
		.orderBy('pinned_at')
		.execute()
	const initialPins = pinRows.map((row) => ({ taskId: row.clickup_task_id, taskName: row.task_name }))

	return (
		<PinsProvider initialPins={initialPins}>
			<div className="min-h-dvh">
				<header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
					<div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
						<Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900">
							<span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
								⚡
							</span>
							ClickUp Lite
						</Link>
						<div className="flex-1" />
						<SearchTrigger />
						<UserMenu name={user.name} clickupUsername={user.clickupUsername} />
					</div>
					<PinnedBar />
				</header>
				<CommandPalette />
				<div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
			</div>
		</PinsProvider>
	)
}
