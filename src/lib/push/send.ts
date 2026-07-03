import webpush from 'web-push'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

let configured = false
function ensureConfigured() {
	if (configured || !env.vapidPublicKey || !env.vapidPrivateKey) return
	webpush.setVapidDetails(env.vapidSubject ?? 'mailto:mitchell@human.marketing', env.vapidPublicKey, env.vapidPrivateKey)
	configured = true
}

export interface PushPayload {
	title: string
	body: string
	url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
	if (!env.vapidPublicKey || !env.vapidPrivateKey) return
	ensureConfigured()

	const subscriptions = await db.selectFrom('push_subscriptions').selectAll().where('user_id', '=', userId).execute()

	await Promise.all(
		subscriptions.map(async (subscription) => {
			try {
				await webpush.sendNotification(
					{ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
					JSON.stringify(payload),
				)
			} catch (err) {
				const statusCode = (err as { statusCode?: number }).statusCode
				if (statusCode === 404 || statusCode === 410) {
					await db.deleteFrom('push_subscriptions').where('id', '=', subscription.id).execute()
				} else {
					console.error('[push] send failed', err)
				}
			}
		}),
	)
}

/** Maps a ClickUp user id to our app user + notification prefs, for webhook fan-out. */
export async function resolveNotifiableUser(clickupUserId: string) {
	const credentials = await db
		.selectFrom('clickup_credentials')
		.select('user_id')
		.where('clickup_user_id', '=', clickupUserId)
		.executeTakeFirst()
	if (!credentials) return null

	const prefs = await db
		.selectFrom('user_prefs')
		.select(['notify_assigned', 'notify_comment'])
		.where('user_id', '=', credentials.user_id)
		.executeTakeFirst()

	return {
		userId: credentials.user_id,
		// No row yet = defaults apply (opt-out model, matching the columns' own DB defaults).
		notifyAssigned: prefs?.notify_assigned ?? true,
		notifyComment: prefs?.notify_comment ?? true,
	}
}
