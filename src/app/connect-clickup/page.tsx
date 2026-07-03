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
		<main>
			<h1>Connect your ClickUp account</h1>
			<p>
				Paste your ClickUp personal API token (ClickUp → Settings → Apps) to finish setting up your account.
				We verify it belongs to the agency workspace before saving it.
			</p>
			<ConnectClickUpForm />
		</main>
	)
}
