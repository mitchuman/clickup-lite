import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { tags } from '@/lib/cache/tags'
import { cu } from '@/lib/clickup/client'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { resolveNotifiableUser, sendPushToUser } from '@/lib/push/send'

// Events that carry a task_id and should invalidate that task's cache tags.
const TASK_EVENTS = new Set([
	'taskCreated',
	'taskUpdated',
	'taskDeleted',
	'taskMoved',
	'taskAssigneeUpdated',
	'taskDueDateUpdated',
	'taskPriorityUpdated',
	'taskStatusUpdated',
	'taskCommentPosted',
	'taskCommentUpdated',
])

const COMMENT_EVENTS = new Set(['taskCommentPosted', 'taskCommentUpdated'])

interface ClickUpWebhookPayload {
	webhook_id: string
	event: string
	task_id?: string
	history_items?: Array<{ user?: { id: number; username: string } }>
}

// Per ClickUp's webhook signature spec: HMAC-SHA256 over the exact raw request
// body, hex digest, header `X-Signature`.
function verifySignature(rawBody: string, signature: string | null): boolean {
	const secret = env.clickupWebhookSecret
	if (!secret || !signature) return false

	const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
	const expectedBuf = Buffer.from(expected, 'utf8')
	const signatureBuf = Buffer.from(signature, 'utf8')
	if (expectedBuf.length !== signatureBuf.length) return false

	return timingSafeEqual(expectedBuf, signatureBuf)
}

export async function POST(request: Request) {
	const rawBody = await request.text()
	const signature = request.headers.get('X-Signature')

	if (!verifySignature(rawBody, signature)) {
		return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
	}

	const payload = JSON.parse(rawBody) as ClickUpWebhookPayload
	const { event, task_id: taskId } = payload

	if (taskId && TASK_EVENTS.has(event)) {
		revalidateTag(tags.task(taskId), 'max')
		// Any task event can change the cmd+k index (name, status, list, existence).
		revalidateTag(tags.teamTaskIndex(), 'max')
		if (COMMENT_EVENTS.has(event)) {
			revalidateTag(tags.taskComments(taskId), 'max')
		}

		// Skipped for deletes (task is already gone). The hourly cacheLife on
		// getUserTasks bounds staleness either way if this fetch fails.
		if (event !== 'taskDeleted') {
			try {
				const task = await cu<{ name: string; url: string; assignees: { id: number; username: string }[] }>(
					`/task/${taskId}`,
					{ token: env.clickupServiceToken },
				)

				for (const assignee of task.assignees) {
					revalidateTag(tags.userTasks(String(assignee.id)), 'max')
				}

				const actor = payload.history_items?.[0]?.user
				const recipients = task.assignees.filter((assignee) => assignee.id !== actor?.id)
				const isComment = COMMENT_EVENTS.has(event)

				if (recipients.length > 0) {
					await db
						.insertInto('notifications')
						.values(
							recipients.map((recipient) => ({
								clickup_user_id: String(recipient.id),
								type: event,
								clickup_task_id: taskId,
								task_name: task.name,
								actor: actor?.username ?? null,
								body: null,
							})),
						)
						.execute()

					await Promise.all(
						recipients.map(async (recipient) => {
							const notifiable = await resolveNotifiableUser(String(recipient.id))
							if (!notifiable) return // hasn't connected their ClickUp account to the app

							const allowed = isComment ? notifiable.notifyComment : notifiable.notifyAssigned
							if (!allowed) return

							await sendPushToUser(notifiable.userId, {
								title: isComment
									? `${actor?.username ?? 'Someone'} commented`
									: `${actor?.username ?? 'Someone'} updated a task`,
								body: task.name,
								// Task detail view doesn't exist yet (Phase 4) — link to the real
								// ClickUp task in the meantime.
								url: task.url,
							})
						}),
					)
				}
			} catch (err) {
				console.error('[clickup-webhook] failed to enrich event', event, taskId, err)
			}
		}
	}

	return NextResponse.json({ ok: true })
}
