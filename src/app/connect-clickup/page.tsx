import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ConnectClickUpForm } from './connect-form'

// Reads the session cookie, so this page is inherently per-request/blocking.
export const instant = false

export default async function ConnectClickUpPage() {
	const session = await getSession()
	if (!session) redirect('/sign-in')

	const existing = await db
		.selectFrom('clickup_credentials')
		.select('user_id')
		.where('user_id', '=', session.user.id)
		.executeTakeFirst()
	if (existing) redirect('/')

	return (
		<main className="flex min-h-dvh items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="mb-6 flex items-center gap-2">
					<span className="flex size-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
						⚡
					</span>
					<div>
						<h1 className="font-semibold text-zinc-900">Connect ClickUp</h1>
						<p className="text-xs text-zinc-500">One more step to finish setup</p>
					</div>
				</div>
				<p className="mb-4 text-sm text-zinc-500">
					Paste your personal API token from ClickUp → Settings → Apps. We verify it belongs to the agency
					workspace before saving it encrypted.
				</p>
				<ConnectClickUpForm />
			</div>
		</main>
	)
}
