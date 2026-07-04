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
				className="block w-full border"
				onKeyDown={(event) => {
					if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
						event.currentTarget.form?.requestSubmit()
					}
				}}
			/>
			<button type="submit" disabled={!text.trim()}>
				Comment
			</button>
		</form>
	)
}
