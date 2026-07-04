import { create } from 'zustand'

export interface PendingComment {
	localId: string
	taskId: string
	text: string
	username: string
	dateMs: number
	failed: boolean
}

interface CommentsState {
	pending: PendingComment[]
	add: (comment: PendingComment) => void
	remove: (localId: string) => void
	markFailed: (localId: string) => void
}

/** Optimistic comments: shown instantly on submit, removed once the server
 * thread (refreshed by postComment's updateTag) includes the real comment. */
export const useCommentsStore = create<CommentsState>()((set) => ({
	pending: [],
	add: (comment) => set((state) => ({ pending: [...state.pending, comment] })),
	remove: (localId) => set((state) => ({ pending: state.pending.filter((c) => c.localId !== localId) })),
	markFailed: (localId) =>
		set((state) => ({
			pending: state.pending.map((c) => (c.localId === localId ? { ...c, failed: true } : c)),
		})),
}))
