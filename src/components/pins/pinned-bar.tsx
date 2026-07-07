'use client'

import Link from 'next/link'
import { usePinsStore } from '@/stores/pins'

/** Renders pins from the zustand store so togglePin updates it instantly. */
export function PinnedBar() {
	const pins = usePinsStore((state) => state.pins)
	if (pins.length === 0) return null

	return (
		<nav aria-label="Pinned tasks" className="border-t border-zinc-100">
			<div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2">
				{pins.map((pin) => (
					<Link
						key={pin.taskId}
						href={`/task/${pin.taskId}`}
						className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-accent hover:text-accent-strong"
					>
						<svg className="size-3 text-accent" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
							<path d="M7.5 1 11 4.5 8.75 6.75l.25 2.5-1.5 1.5L5 8.25 2.5 10.75l-1.25-1.25L3.75 7 1.25 4.5l1.5-1.5 2.5.25L7.5 1Z" />
						</svg>
						{pin.taskName}
					</Link>
				))}
			</div>
		</nav>
	)
}
