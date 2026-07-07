'use client'

import { useLayoutEffect, type ReactNode } from 'react'
import { usePinsStore, type Pin } from '@/stores/pins'

/** One-time store seed from the layout's server-fetched pin rows. useLayoutEffect
 * avoids the "setState during render" error the old sync-hydrate pattern hit. */
export function PinsProvider({ initialPins, children }: { initialPins: Pin[]; children: ReactNode }) {
	useLayoutEffect(() => {
		usePinsStore.getState().hydrate(initialPins)
	}, [initialPins])

	return children
}
