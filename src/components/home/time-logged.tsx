import { getUserTimeEntries } from '@/lib/clickup/cached'
import { formatDuration } from '@/lib/date'

export async function TimeLogged({ clickupUserId }: { clickupUserId: string }) {
	const isoDate = new Date().toISOString().slice(0, 10)
	const entries = await getUserTimeEntries(clickupUserId, isoDate)
	const totalMs = entries.reduce((sum, entry) => sum + entry.durationMs, 0)

	return (
		<section>
			<h2>Logged today: {formatDuration(totalMs)}</h2>
			{entries.length === 0 ? (
				<p>No time logged today.</p>
			) : (
				<ul>
					{entries.map((entry) => (
						<li key={entry.id}>
							{entry.taskName ?? 'Unknown task'} — {formatDuration(entry.durationMs)}
						</li>
					))}
				</ul>
			)}
		</section>
	)
}
