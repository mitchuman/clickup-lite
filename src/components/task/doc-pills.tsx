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
					className="rounded-full border px-3 py-1 text-sm"
				>
					{link.label}
				</a>
			))}
		</nav>
	)
}
