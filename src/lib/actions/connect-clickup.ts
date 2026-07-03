'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ClickUpTokenError, verifyClickUpToken } from '@/lib/clickup/verify-token'
import { encrypt } from '@/lib/crypto'
import { db } from '@/lib/db'

export interface ConnectClickUpState {
	error?: string
}

export async function connectClickUpAccount(
	_prevState: ConnectClickUpState,
	formData: FormData,
): Promise<ConnectClickUpState> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) redirect('/sign-in')

	const token = String(formData.get('token') ?? '').trim()
	if (!token) return { error: 'Paste your ClickUp personal API token.' }

	try {
		const { clickupUserId, clickupUsername, clickupEmail } = await verifyClickUpToken(token)
		const tokenCiphertext = encrypt(token)
		const verifiedAt = new Date()

		await db
			.insertInto('clickup_credentials')
			.values({
				user_id: session.user.id,
				clickup_user_id: clickupUserId,
				clickup_username: clickupUsername,
				clickup_email: clickupEmail,
				token_ciphertext: tokenCiphertext,
				verified_at: verifiedAt,
			})
			.onConflict((oc) =>
				oc.column('user_id').doUpdateSet({
					clickup_user_id: clickupUserId,
					clickup_username: clickupUsername,
					clickup_email: clickupEmail,
					token_ciphertext: tokenCiphertext,
					verified_at: verifiedAt,
					updated_at: new Date(),
				}),
			)
			.execute()
	} catch (err) {
		if (err instanceof ClickUpTokenError) return { error: err.message }
		if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
			return { error: 'This ClickUp account is already connected to a different login.' }
		}
		throw err
	}

	redirect('/')
}
