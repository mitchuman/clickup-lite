import { create } from 'zustand'

export interface Pin {
	taskId: string
	taskName: string
}

interface PinsState {
	pins: Pin[]
	hydrated: boolean
	/** One-time seed from the server-rendered PinnedBar; after that the store
	 * is the source of truth so optimistic toggles never get clobbered. */
	hydrate: (pins: Pin[]) => void
	toggle: (pin: Pin) => void
}

export const usePinsStore = create<PinsState>()((set) => ({
	pins: [],
	hydrated: false,
	hydrate: (pins) => set((state) => (state.hydrated ? state : { pins, hydrated: true })),
	toggle: (pin) =>
		set((state) => {
			const exists = state.pins.some((p) => p.taskId === pin.taskId)
			return { pins: exists ? state.pins.filter((p) => p.taskId !== pin.taskId) : [...state.pins, pin] }
		}),
}))
