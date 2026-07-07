import { Card, CardTitle, EmptyState } from '@/components/ui/card'
import { getUserTimeEntries } from '@/lib/clickup/cached'
import { formatDuration } from '@/lib/date'

export async function TimeLogged({ clickupUserId }: { clickupUserId: string }) {
	const isoDate = new Date().toISOString().slice(0, 10)
	const entries = await getUserTimeEntries(clickupUserId, isoDate)
	const totalMs = entries.reduce((sum, entry) => sum + entry.durationMs, 0)

	return (
		<Card>
			<CardTitle>Logged today · {formatDuration(totalMs)}</CardTitle>
			{entries.length === 0 ? (
				<EmptyState>No time logged today.</EmptyState>
			) : (
				<ul className="space-y-1">
					{entries.map((entry) => (
						<li key={entry.id} className="flex items-baseline gap-2 py-0.5">
							<span className="truncate text-sm text-zinc-800">{entry.taskName ?? 'Unknown task'}</span>
							<span className="ml-auto shrink-0 font-mono text-xs text-zinc-400">
								{formatDuration(entry.durationMs)}
							</span>
						</li>
					))}
				</ul>
			)}
		</Card>
	)
}
