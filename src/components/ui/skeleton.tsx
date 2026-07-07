import { Card, CardTitle } from './card'

/** Card-shaped loading fallback so Suspense boundaries paint layout instantly. */
export function CardSkeleton({ title, rows = 3 }: { title: string; rows?: number }) {
	return (
		<Card>
			<CardTitle>{title}</CardTitle>
			<div className="space-y-2">
				{Array.from({ length: rows }, (_, i) => (
					<div key={i} className="h-4 animate-pulse rounded bg-zinc-100" style={{ width: `${85 - i * 15}%` }} />
				))}
			</div>
		</Card>
	)
}
