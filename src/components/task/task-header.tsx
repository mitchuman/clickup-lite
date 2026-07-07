import { notFound } from 'next/navigation'
import { PinButton } from '@/components/pins/pin-button'
import { getTask } from '@/lib/clickup/cached'
import { ClickUpApiError } from '@/lib/clickup/client'
import { formatDuration } from '@/lib/date'

function formatDueDate(ms: number): string {
	return new Date(ms).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
}

export async function TaskHeader({ taskId }: { taskId: string }) {
	let task
	try {
		task = await getTask(taskId)
	} catch (err) {
		if (err instanceof ClickUpApiError && err.status === 404) notFound()
		throw err
	}

	return (
		<header>
			<div className="flex items-start justify-between gap-3">
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900">{task.name}</h1>
				<PinButton taskId={task.id} taskName={task.name} />
			</div>
			<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-zinc-500">
				<span
					className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white uppercase"
					style={{ backgroundColor: task.status.color }}
				>
					{task.status.status}
				</span>
				<span>
					{task.folderName ? `${task.folderName} / ` : ''}
					{task.listName}
				</span>
				{task.dueDate !== null && <span>Due {formatDueDate(task.dueDate)}</span>}
				{task.priority && <span style={{ color: task.priority.color }}>⚑ {task.priority.priority}</span>}
				{task.timeEstimateMs !== null && <span>Est {formatDuration(task.timeEstimateMs)}</span>}
				{task.assignees.length > 0 && <span>{task.assignees.map((a) => a.username).join(', ')}</span>}
				<a
					href={task.url}
					target="_blank"
					rel="noreferrer"
					className="text-accent-strong hover:underline"
				>
					Open in ClickUp ↗
				</a>
			</div>
			{task.description && (
				<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 shadow-sm">
					{task.description}
				</div>
			)}
		</header>
	)
}
