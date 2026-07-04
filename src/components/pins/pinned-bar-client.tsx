'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { usePinsStore, type Pin } from '@/stores/pins'

/** Renders pins from the zustand store so togglePin updates it instantly,
 * seeded once from the server-rendered pin rows. */
export function PinnedBarClient({ initialPins }: { initialPins: Pin[] }) {
	// Hydrate synchronously on first render (not in an effect) so the bar never
	// flashes empty; the store's hydrate() is a no-op after the first call.
	const seeded = useRef(false)
	if (!seeded.current) {
		usePinsStore.getState().hydrate(initialPins)
		seeded.current = true
	}

	const pins = usePinsStore((state) => state.pins)
	if (pins.length === 0) return null

	return (
		<nav aria-label="Pinned tasks" className="flex flex-wrap gap-2">
			{pins.map((pin) => (
				<Link key={pin.taskId} href={`/task/${pin.taskId}`} className="rounded-full border px-3 py-1 text-sm">
					📌 {pin.taskName}
				</Link>
			))}
		</nav>
	)
}
