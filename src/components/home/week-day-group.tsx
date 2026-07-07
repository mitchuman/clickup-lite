'use client'

import { Collapsible } from '@base-ui/react/collapsible'
import type { ReactNode } from 'react'

/** One day bucket in the week view — Base UI Collapsible keeps long weeks scannable. */
export function WeekDayGroup({ day, count, defaultOpen, children }: { day: string; count: number; defaultOpen?: boolean; children: ReactNode }) {
	return (
		<Collapsible.Root defaultOpen={defaultOpen ?? false} className="group">
			<Collapsible.Trigger className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left outline-none select-none hover:bg-zinc-50">
				<svg
					className="size-3.5 text-zinc-400 transition-transform group-data-panel-open:rotate-90"
					viewBox="0 0 16 16"
					fill="currentColor"
					aria-hidden
				>
					<path d="M6 4l4 4-4 4V4z" />
				</svg>
				<span className="text-xs font-semibold text-zinc-500">{day}</span>
				<span className="text-xs text-zinc-400">· {count}</span>
			</Collapsible.Trigger>
			<Collapsible.Panel className="overflow-hidden data-starting-style:h-0 data-ending-style:h-0 transition-[height] duration-150">
				{children}
			</Collapsible.Panel>
		</Collapsible.Root>
	)
}
