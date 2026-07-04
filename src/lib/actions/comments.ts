'use server'

import { updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { tags } from '@/lib/cache/tags'
import { cu } from '@/lib/clickup/client'
import { decrypt } from '@/lib/crypto'
import { getClickUpCredentials } from '@/lib/session'

/**
 * Posts a comment as the acting user (their own ClickUp token → correct
 * attribution in ClickUp), then updateTag so the very next read of the thread
 * blocks on fresh data instead of serving the stale cache entry.
 */
export async function postComment(taskId: string, text: string): Promise<void> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error('Not authenticated')

	const trimmed = text.trim()
	if (!trimmed) throw new Error('Comment cannot be empty')

	const credentials = await getClickUpCredentials(session.user.id)
	if (!credentials) throw new Error('ClickUp account not connected')

	const token = decrypt(credentials.token_ciphertext)
	await cu(`/task/${taskId}/comment`, {
		token,
		method: 'POST',
		body: { comment_text: trimmed, notify_all: false },
	})

	updateTag(tags.taskComments(taskId))
}
