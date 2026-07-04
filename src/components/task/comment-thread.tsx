import { getTaskComments } from '@/lib/clickup/cached'

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
	const comments = await getTaskComments(taskId)

	return (
		<section>
			<h2>Comments ({comments.length})</h2>
			{comments.length === 0 ? (
				<p>No comments yet.</p>
			) : (
				<ul>
					{comments.map((comment) => (
						<li key={comment.id}>
							<p>
								<strong>{comment.user.username}</strong> · {formatCommentDate(comment.dateMs)}
								{comment.replyCount > 0 && <> · {comment.replyCount} replies</>}
							</p>
							<p className="whitespace-pre-wrap">{comment.text}</p>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
