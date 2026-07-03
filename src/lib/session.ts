import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const getSession = cache(async () => {
	return auth.api.getSession({ headers: await headers() })
})

/** Full server-side auth gate: redirects to sign-in or ClickUp-connect as needed. */
export async function requireUser() {
	const session = await getSession()
	if (!session) redirect('/sign-in')

	const credentials = await db
		.selectFrom('clickup_credentials')
		.select(['clickup_user_id', 'clickup_username'])
		.where('user_id', '=', session.user.id)
		.executeTakeFirst()

	if (!credentials) redirect('/connect-clickup')

	return {
		userId: session.user.id,
		name: session.user.name,
		email: session.user.email,
		clickupUserId: credentials.clickup_user_id,
		clickupUsername: credentials.clickup_username,
	}
}

/** For Server Actions that need the acting user's personal ClickUp token. */
export async function getClickUpCredentials(userId: string) {
	return db
		.selectFrom('clickup_credentials')
		.select(['clickup_user_id', 'clickup_username', 'clickup_email', 'token_ciphertext'])
		.where('user_id', '=', userId)
		.executeTakeFirst()
}
