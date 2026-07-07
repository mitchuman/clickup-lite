'use client'

import { togglePin } from '@/lib/actions/pins'
import { usePinsStore } from '@/stores/pins'

/** Optimistic pin toggle: flips the store (PinnedBar updates instantly) and
 * persists in the background, rolling back if the server rejects it. */
export function PinButton({ taskId, taskName }: { taskId: string; taskName: string }) {
	const isPinned = usePinsStore((state) => state.pins.some((pin) => pin.taskId === taskId))

	function handleClick() {
		usePinsStore.getState().toggle({ taskId, taskName })
		togglePin(taskId, taskName).catch(() => {
			usePinsStore.getState().toggle({ taskId, taskName })
		})
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
				isPinned
					? 'border-accent bg-accent-soft text-accent-strong'
					: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
			}`}
		>
			<svg className="size-3.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
				<path d="M7.5 1 11 4.5 8.75 6.75l.25 2.5-1.5 1.5L5 8.25 2.5 10.75l-1.25-1.25L3.75 7 1.25 4.5l1.5-1.5 2.5.25L7.5 1Z" />
			</svg>
			{isPinned ? 'Pinned' : 'Pin'}
		</button>
	)
}
