'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TaskIndexEntry } from '@/lib/clickup/types'
import { fuzzyScore } from '@/lib/search'
import { usePinsStore } from '@/stores/pins'

const RECENTS_KEY = 'cmdk-recents'
const MAX_RECENTS = 10
const MAX_RESULTS = 12

interface PaletteItem {
	id: string
	name: string
	detail: string
	section: 'Pinned' | 'Recent' | 'Tasks' | 'More'
}

function readRecents(): { id: string; name: string }[] {
	if (typeof window === 'undefined') return []
	try {
		return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
	} catch {
		return []
	}
}

// Module-level so the index survives palette close/open and route changes —
// fetched at most once per browser session, per the "instant tier 1" mandate.
let sessionIndex: TaskIndexEntry[] | null = null

export function CommandPalette() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [highlight, setHighlight] = useState(0)
	const [index, setIndex] = useState<TaskIndexEntry[] | null>(sessionIndex)
	// Tier-2 results stay tied to the query they answered, so stale responses
	// never render against a newer query (no clearing-in-effect needed).
	const [remote, setRemote] = useState<{ query: string; results: TaskIndexEntry[] }>({ query: '', results: [] })
	const [recents, setRecents] = useState(readRecents)
	const pins = usePinsStore((state) => state.pins)

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				setOpen((value) => !value)
			}
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	// Tier 1 corpus: fetched once per session on first open.
	useEffect(() => {
		if (!open || sessionIndex) return
		let cancelled = false
		fetch('/api/search-index')
			.then((res) => (res.ok ? res.json() : []))
			.then((data: TaskIndexEntry[]) => {
				if (cancelled) return
				sessionIndex = data
				setIndex(data)
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [open])

	// Tier 2: debounced network search for what tier 1 doesn't have (closed tasks).
	const trimmedQuery = query.trim()
	useEffect(() => {
		if (!open || trimmedQuery.length < 2) return
		const timer = setTimeout(() => {
			fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`)
				.then((res) => (res.ok ? res.json() : []))
				.then((results: TaskIndexEntry[]) => setRemote({ query: trimmedQuery, results }))
				.catch(() => {})
		}, 250)
		return () => clearTimeout(timer)
	}, [open, trimmedQuery])

	const items: PaletteItem[] = []
	if (trimmedQuery === '') {
		for (const pin of pins) items.push({ id: pin.taskId, name: pin.taskName, detail: '', section: 'Pinned' })
		for (const recent of recents) {
			if (items.some((item) => item.id === recent.id)) continue
			items.push({ id: recent.id, name: recent.name, detail: '', section: 'Recent' })
		}
	} else {
		const corpus: TaskIndexEntry[] =
			index ??
			pins.map((pin) => ({ id: pin.taskId, name: pin.taskName, listName: '', status: '', closed: false }))
		const scored = corpus
			.map((entry) => ({ entry, score: fuzzyScore(trimmedQuery, `${entry.name} ${entry.listName}`) }))
			.filter(({ score }) => score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_RESULTS)
		for (const { entry } of scored) {
			items.push({ id: entry.id, name: entry.name, detail: entry.listName, section: 'Tasks' })
		}
		if (remote.query === trimmedQuery) {
			for (const entry of remote.results) {
				if (items.some((item) => item.id === entry.id)) continue
				items.push({
					id: entry.id,
					name: entry.name,
					detail: `${entry.listName}${entry.closed ? ' · closed' : ''}`,
					section: 'More',
				})
			}
		}
	}
	const highlighted = Math.min(highlight, Math.max(items.length - 1, 0))

	function select(item: PaletteItem) {
		const next = [{ id: item.id, name: item.name }, ...recents.filter((r) => r.id !== item.id)].slice(0, MAX_RECENTS)
		setRecents(next)
		localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
		setOpen(false)
		setQuery('')
		router.push(`/task/${item.id}`)
	}

	function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setHighlight((value) => Math.min(value + 1, items.length - 1))
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			setHighlight((value) => Math.max(value - 1, 0))
		} else if (event.key === 'Enter' && items[highlighted]) {
			event.preventDefault()
			select(items[highlighted])
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-zinc-900/30 backdrop-blur-[2px] transition-opacity duration-100 data-starting-style:opacity-0 data-ending-style:opacity-0" />
				<Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]">
					<Dialog.Popup className="w-full max-w-lg origin-top overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl transition-[scale,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
						<Dialog.Title className="sr-only">Search tasks</Dialog.Title>
						<div className="flex items-center gap-2 border-b border-zinc-100 px-4">
							<svg
								className="size-4 shrink-0 text-zinc-400"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden
							>
								<circle cx="7" cy="7" r="4.5" />
								<path d="m10.5 10.5 3 3" strokeLinecap="round" />
							</svg>
							<input
								autoFocus
								value={query}
								onChange={(event) => {
									setQuery(event.target.value)
									setHighlight(0)
								}}
								onKeyDown={onInputKeyDown}
								placeholder="Search tasks…"
								className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-zinc-400"
							/>
							<kbd className="shrink-0 rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400">esc</kbd>
						</div>
						<ul className="max-h-80 overflow-y-auto p-1.5">
							{items.length === 0 && (
								<li className="px-2.5 py-6 text-center text-sm text-zinc-400">
									{trimmedQuery === '' ? 'No pins or recent tasks yet.' : index ? 'No matches.' : 'Loading index…'}
								</li>
							)}
							{items.map((item, i) => (
								<li key={`${item.section}-${item.id}`}>
									{(i === 0 || items[i - 1].section !== item.section) && (
										<p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
											{item.section}
										</p>
									)}
									<button
										type="button"
										onClick={() => select(item)}
										onMouseMove={() => setHighlight(i)}
										className={`flex w-full cursor-pointer items-baseline gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
											i === highlighted ? 'bg-accent-soft text-accent-strong' : 'text-zinc-700'
										}`}
									>
										<span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
										{item.detail && (
											<span className="max-w-[40%] shrink-0 truncate text-xs text-zinc-400">{item.detail}</span>
										)}
									</button>
								</li>
							))}
						</ul>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
