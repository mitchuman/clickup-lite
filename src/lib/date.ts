// UTC-based day boundaries for now — revisit once user_prefs.timezone is wired up.

export function startOfTodayMs(): number {
	const now = new Date()
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

export function isSameUtcDay(ms: number, reference: Date): boolean {
	const date = new Date(ms)
	return (
		date.getUTCFullYear() === reference.getUTCFullYear() &&
		date.getUTCMonth() === reference.getUTCMonth() &&
		date.getUTCDate() === reference.getUTCDate()
	)
}

export function formatDuration(ms: number): string {
	const totalMinutes = Math.round(ms / 60_000)
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	if (hours === 0) return `${minutes}m`
	return `${hours}h ${minutes}m`
}
