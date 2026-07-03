'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface PushSubscriptionInput {
	endpoint: string
	keys: { p256dh: string; auth: string }
}

export async function savePushSubscription(subscription: PushSubscriptionInput, userAgent: string | null) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error('Not authenticated')

	await db
		.insertInto('push_subscriptions')
		.values({
			user_id: session.user.id,
			endpoint: subscription.endpoint,
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth,
			user_agent: userAgent,
		})
		.onConflict((oc) =>
			oc.column('endpoint').doUpdateSet({
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				user_agent: userAgent,
			}),
		)
		.execute()
}

export async function removePushSubscription(endpoint: string) {
	await db.deleteFrom('push_subscriptions').where('endpoint', '=', endpoint).execute()
}
