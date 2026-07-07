'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { postComment } from '@/lib/actions/comments'
import { useCommentsStore } from '@/stores/comments'

/**
 * Optimistic composer: the comment appears in the thread the moment you hit
 * send (zustand pending list), while postComment runs in the background and
 * its updateTag refreshes the server-rendered thread with the real comment.
 */
export function CommentComposer({ taskId, username }: { taskId: string; username: string }) {
	const [text, setText] = useState('')
	const [, startTransition] = useTransition()

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const trimmed = text.trim()
		if (!trimmed) return

		const { add, remove, markFailed } = useCommentsStore.getState()
		const localId = crypto.randomUUID()
		add({ localId, taskId, text: trimmed, username, dateMs: Date.now(), failed: false })
		setText('')

		startTransition(async () => {
			try {
				await postComment(taskId, trimmed)
				remove(localId)
			} catch {
				markFailed(localId)
			}
		})
	}

	return (
		<form onSubmit={handleSubmit}>
			<textarea
				value={text}
				onChange={(event) => setText(event.target.value)}
				placeholder="Write a comment…"
				rows={3}
				className="block w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent-soft"
				onKeyDown={(event) => {
					if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
						event.currentTarget.form?.requestSubmit()
					}
				}}
			/>
			<div className="mt-2 flex items-center justify-end gap-3">
				<span className="text-xs text-zinc-400">⌘↵ to send</span>
				<button
					type="submit"
					disabled={!text.trim()}
					className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
				>
					Comment
				</button>
			</div>
		</form>
	)
}
