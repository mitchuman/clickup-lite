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
		<section>
			<h1>
				{task.name} <PinButton taskId={task.id} taskName={task.name} />
			</h1>
			<p>
				<span style={{ color: task.status.color }}>{task.status.status}</span>
				{' · '}
				{task.folderName ? `${task.folderName} / ` : ''}
				{task.listName}
				{task.dueDate !== null && <> · due {formatDueDate(task.dueDate)}</>}
				{task.priority && (
					<>
						{' · '}
						<span style={{ color: task.priority.color }}>{task.priority.priority}</span>
					</>
				)}
				{task.timeEstimateMs !== null && <> · est {formatDuration(task.timeEstimateMs)}</>}
			</p>
			{task.assignees.length > 0 && <p>Assignees: {task.assignees.map((a) => a.username).join(', ')}</p>}
			{task.description && <div className="whitespace-pre-wrap">{task.description}</div>}
			<p>
				<a href={task.url} target="_blank" rel="noreferrer">
					Open in ClickUp
				</a>
			</p>
		</section>
	)
}
