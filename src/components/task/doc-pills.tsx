import { getTask } from '@/lib/clickup/cached'

const KNOWN_HOSTS: Record<string, string> = {
	'docs.google.com': 'Google Docs',
	'sheets.google.com': 'Google Sheets',
	'drive.google.com': 'Google Drive',
	'www.figma.com': 'Figma',
	'figma.com': 'Figma',
	'www.notion.so': 'Notion',
	'notion.so': 'Notion',
	'www.loom.com': 'Loom',
	'loom.com': 'Loom',
	'github.com': 'GitHub',
}

function extractLinks(description: string): { url: string; label: string }[] {
	const matches = description.match(/https?:\/\/[^\s)\]>"'`]+/g) ?? []
	const seen = new Set<string>()
	const links: { url: string; label: string }[] = []
	for (const raw of matches) {
		const url = raw.replace(/[.,;:!?]+$/, '')
		if (seen.has(url)) continue
		seen.add(url)
		try {
			const { hostname } = new URL(url)
			links.push({ url, label: KNOWN_HOSTS[hostname] ?? hostname })
		} catch {
			// unparseable URL fragment — skip it
		}
	}
	return links
}

/**
 * Pills for every link found in the task description. Reuses getTask's cache
 * entry (same fetch as TaskHeader) — this is a sibling boundary purely so link
 * parsing never delays the header paint, not a second network call.
 */
export async function DocPills({ taskId }: { taskId: string }) {
	const task = await getTask(taskId)
	if (!task.description) return null

	const links = extractLinks(task.description)
	if (links.length === 0) return null

	return (
		<nav aria-label="Linked documents" className="flex flex-wrap gap-2">
			{links.map((link) => (
				<a
					key={link.url}
					href={link.url}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:border-accent hover:text-accent-strong"
				>
					<svg className="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
						<path d="M5 7 7 5m-3.5.5-1 1a1.77 1.77 0 0 0 2.5 2.5l1-1m1.5-1.5 1-1A1.77 1.77 0 0 0 6 3l-1 1" strokeLinecap="round" />
					</svg>
					{link.label} ↗
				</a>
			))}
		</nav>
	)
}
