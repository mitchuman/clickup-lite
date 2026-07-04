import { Suspense } from 'react'
import { CommentThread } from '@/components/task/comment-thread'
import { DocPills } from '@/components/task/doc-pills'
import { TaskHeader } from '@/components/task/task-header'

// Static frame paints immediately; the three data widgets stream in as
// independent Suspense boundaries (two share the getTask cache entry, the
// comment thread has its own fetch) — no waterfalls.
export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
	const { taskId } = await params

	return (
		<main>
			<Suspense fallback={<p>Loading task…</p>}>
				<TaskHeader taskId={taskId} />
			</Suspense>
			<Suspense fallback={null}>
				<DocPills taskId={taskId} />
			</Suspense>
			<Suspense fallback={<p>Loading comments…</p>}>
				<CommentThread taskId={taskId} />
			</Suspense>
		</main>
	)
}
