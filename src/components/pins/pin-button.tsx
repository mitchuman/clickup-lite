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
		<button type="button" onClick={handleClick}>
			{isPinned ? 'Unpin' : 'Pin'}
		</button>
	)
}
