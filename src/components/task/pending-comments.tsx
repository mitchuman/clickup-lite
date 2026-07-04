'use client'

import { useCommentsStore, type PendingComment } from '@/stores/comments'

function retry(comment: PendingComment) {
	// Re-submitting is just re-adding through the composer flow; keep it simple:
	// clear the failed entry and let the user resend from the composer.
	useCommentsStore.getState().remove(comment.localId)
}

/** In-flight optimistic comments, rendered right below the server thread. */
export function PendingComments({ taskId }: { taskId: string }) {
	// Select the raw array (stable snapshot) and filter outside the selector —
	// filtering inside would return a fresh array every call and loop renders.
	const allPending = useCommentsStore((state) => state.pending)
	const pending = allPending.filter((c) => c.taskId === taskId)
	if (pending.length === 0) return null

	return (
		<ul>
			{pending.map((comment) => (
				<li key={comment.localId} className={comment.failed ? 'text-red-600' : 'opacity-60'}>
					<p>
						<strong>{comment.username}</strong> · {comment.failed ? 'failed to send' : 'sending…'}
						{comment.failed && (
							<>
								{' '}
								<button type="button" onClick={() => retry(comment)}>
									dismiss
								</button>
							</>
						)}
					</p>
					<p className="whitespace-pre-wrap">{comment.text}</p>
				</li>
			))}
		</ul>
	)
}
