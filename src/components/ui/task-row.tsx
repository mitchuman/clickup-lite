import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
	open: 'bg-emerald-400',
	custom: 'bg-blue-400',
	closed: 'bg-zinc-300',
}

/** Compact task list row used across homepage widgets. */
export function TaskRow({
	taskId,
	name,
	meta,
	statusType = 'open',
}: {
	taskId: string
	name: string
	meta?: string
	statusType?: string
}) {
	return (
		<li>
			<Link
				href={`/task/${taskId}`}
				className="group -mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50"
			>
				<span
					className={`size-1.5 shrink-0 rounded-full ${STATUS_COLORS[statusType] ?? 'bg-zinc-300'}`}
					aria-hidden
				/>
				<span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 group-hover:text-accent-strong">
					{name}
				</span>
				{meta && <span className="max-w-[35%] shrink-0 truncate text-xs text-zinc-400">{meta}</span>}
			</Link>
		</li>
	)
}
