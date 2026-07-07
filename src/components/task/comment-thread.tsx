import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { getTaskComments } from '@/lib/clickup/cached'
import { requireUser } from '@/lib/session'
import { CommentComposer } from './comment-composer'
import { PendingComments } from './pending-comments'

function formatCommentDate(ms: number): string {
	return new Date(ms).toLocaleString('en-US', {
		timeZone: 'UTC',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

export async function CommentThread({ taskId }: { taskId: string }) {
	// Parallel: cached ClickUp fetch + session lookup (needed for the optimistic
	// composer's attribution) — never sequential.
	const [comments, user] = await Promise.all([getTaskComments(taskId), requireUser()])

	return (
		<Card>
			<CardTitle>Comments · {comments.length}</CardTitle>
			{comments.length === 0 ? (
				<EmptyState>No comments yet.</EmptyState>
			) : (
				<ul className="space-y-4">
					{comments.map((comment) => (
						<li key={comment.id} className="flex gap-3">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 uppercase">
								{comment.user.username.slice(0, 2)}
							</span>
							<div className="min-w-0">
								<p className="text-xs text-zinc-400">
									<span className="font-semibold text-zinc-700">{comment.user.username}</span> ·{' '}
									{formatCommentDate(comment.dateMs)}
									{comment.replyCount > 0 && <> · {comment.replyCount} replies</>}
								</p>
								<p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">{comment.text}</p>
							</div>
						</li>
					))}
				</ul>
			)}
			<PendingComments taskId={taskId} />
			<div className="mt-4 border-t border-zinc-100 pt-4">
				<CommentComposer taskId={taskId} username={user.clickupUsername} />
			</div>
		</Card>
	)
}
