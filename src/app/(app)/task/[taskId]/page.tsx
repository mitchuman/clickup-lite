import { Suspense } from 'react'
import { CommentThread } from '@/components/task/comment-thread'
import { DocPills } from '@/components/task/doc-pills'
import { TaskHeader } from '@/components/task/task-header'
import { CardSkeleton } from '@/components/ui/skeleton'

function HeaderSkeleton() {
	return (
		<div className="space-y-3">
			<div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" />
			<div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
		</div>
	)
}

// Static frame paints immediately; the three data widgets stream in as
// independent Suspense boundaries (two share the getTask cache entry, the
// comment thread has its own fetch) — no waterfalls.
export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
	const { taskId } = await params

	return (
		<main className="space-y-5">
			<Suspense fallback={<HeaderSkeleton />}>
				<TaskHeader taskId={taskId} />
			</Suspense>
			<Suspense fallback={null}>
				<DocPills taskId={taskId} />
			</Suspense>
			<Suspense fallback={<CardSkeleton title="Comments" />}>
				<CommentThread taskId={taskId} />
			</Suspense>
		</main>
	)
}
