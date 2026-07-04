import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTaskIndex } from '@/lib/clickup/cached'

/**
 * cmd+k tier 1: the whole open-task index in one payload, fetched once per
 * session by the palette so filtering is a 0ms client-side operation. The
 * heavy lifting is one shared 'use cache: remote' entry (team:task-index),
 * webhook-fresh — this route just gates it behind the session.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

	return NextResponse.json(await getTaskIndex())
}
