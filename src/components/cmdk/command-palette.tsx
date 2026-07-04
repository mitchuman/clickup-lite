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
				<Dialog.Backdrop className="fixed inset-0 bg-black/40" />
				<Dialog.Viewport className="fixed inset-0 flex items-start justify-center pt-24">
					<Dialog.Popup className="w-full max-w-lg rounded-lg border bg-white p-2 shadow-xl">
						<Dialog.Title className="sr-only">Search tasks</Dialog.Title>
						<input
							autoFocus
							value={query}
							onChange={(event) => {
								setQuery(event.target.value)
								setHighlight(0)
							}}
							onKeyDown={onInputKeyDown}
							placeholder="Search tasks…"
							className="block w-full border-b p-2 outline-none"
						/>
						<ul className="max-h-80 overflow-y-auto">
							{items.length === 0 && (
								<li className="p-2 text-sm opacity-60">
									{trimmedQuery === '' ? 'No pins or recent tasks yet.' : index ? 'No matches.' : 'Loading index…'}
								</li>
							)}
							{items.map((item, i) => (
								<li key={`${item.section}-${item.id}`}>
									{(i === 0 || items[i - 1].section !== item.section) && (
										<p className="px-2 pt-2 text-xs uppercase opacity-50">{item.section}</p>
									)}
									<button
										type="button"
										onClick={() => select(item)}
										onMouseMove={() => setHighlight(i)}
										className={`block w-full cursor-pointer p-2 text-left ${i === highlighted ? 'bg-black/10' : ''}`}
									>
										{item.name}
										{item.detail && <span className="ml-2 text-sm opacity-60">{item.detail}</span>}
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
