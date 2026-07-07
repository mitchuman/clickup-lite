'use client'

/** Header affordance for the palette — dispatches the same cmd+k the global
 * listener already handles, so there's exactly one open/close code path. */
export function SearchTrigger() {
	return (
		<button
			type="button"
			onClick={() => {
				window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
			}}
			className="flex w-56 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-500"
		>
			<svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
				<circle cx="7" cy="7" r="4.5" />
				<path d="m10.5 10.5 3 3" strokeLinecap="round" />
			</svg>
			<span className="flex-1 text-left">Search tasks…</span>
			<kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[10px] text-zinc-400">⌘K</kbd>
		</button>
	)
}
