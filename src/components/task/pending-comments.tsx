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
		<ul className="mt-4 space-y-4">
			{pending.map((comment) => (
				<li key={comment.localId} className={`flex gap-3 ${comment.failed ? '' : 'opacity-60'}`}>
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-strong uppercase">
						{comment.username.slice(0, 2)}
					</span>
					<div className="min-w-0">
						<p className={`text-xs ${comment.failed ? 'text-red-600' : 'text-zinc-400'}`}>
							<span className="font-semibold text-zinc-700">{comment.username}</span> ·{' '}
							{comment.failed ? 'failed to send' : 'sending…'}
							{comment.failed && (
								<>
									{' '}
									<button type="button" onClick={() => retry(comment)} className="underline">
										dismiss
									</button>
								</>
							)}
						</p>
						<p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">{comment.text}</p>
					</div>
				</li>
			))}
		</ul>
	)
}
