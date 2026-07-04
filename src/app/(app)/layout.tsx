import { Suspense, type ReactNode } from 'react'
import { CommandPalette } from '@/components/cmdk/command-palette'
import { PinnedBar } from '@/components/pins/pinned-bar'
import { EnablePushButton } from '@/components/push/enable-push-button'
import { requireUser } from '@/lib/session'
import { SignOutButton } from './sign-out-button'

// This gate is inherently a blocking, per-request check (we can't show
// protected content before we know who's asking) — the static-shell/Suspense
// split for genuinely shareable chrome comes with the real nav shell in
// Phase 4. For now the whole (app) segment renders dynamically.
export const instant = false

export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await requireUser()

	return (
		<div>
			<header>
				<span>
					{user.name} · ClickUp: {user.clickupUsername}
				</span>
				<EnablePushButton />
				<SignOutButton />
			</header>
			<Suspense fallback={null}>
				<PinnedBar />
			</Suspense>
			<CommandPalette />
			{children}
		</div>
	)
}
