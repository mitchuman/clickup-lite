import { cn } from 'cnfast'
import type { ReactNode } from 'react'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<section className={cn('rounded-xl border border-zinc-200 bg-white p-4 shadow-sm', className)}>
			{children}
		</section>
	)
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<h2 className={cn('mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase', className)}>{children}</h2>
	)
}

export function EmptyState({ children }: { children: ReactNode }) {
	return <p className="text-sm text-zinc-400">{children}</p>
}
