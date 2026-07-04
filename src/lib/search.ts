/**
 * Tiny dependency-free fuzzy scorer shared by the cmd+k client filter and the
 * /api/search route. Higher is better; 0 means no match.
 */
export function fuzzyScore(query: string, text: string): number {
	const q = query.toLowerCase()
	const t = text.toLowerCase()
	if (q.length === 0) return 0

	// Direct substring: strongest signal — earlier and tighter matches rank higher.
	const idx = t.indexOf(q)
	if (idx !== -1) return 1000 - idx - (t.length - q.length) * 0.1

	// In-order subsequence (e.g. "hmpg" → "homepage"), consecutive runs score more.
	let searchFrom = 0
	let score = 0
	let lastMatch = -2
	for (const char of q) {
		const found = t.indexOf(char, searchFrom)
		if (found === -1) return 0
		score += lastMatch === found - 1 ? 5 : 1
		lastMatch = found
		searchFrom = found + 1
	}
	return score
}
