import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getArchiveTaskIndex } from '@/lib/clickup/cached'
import { fuzzyScore } from '@/lib/search'

const MAX_RESULTS = 20

/**
 * cmd+k tier 2: matches against open + recently-closed tasks. ClickUp v2 has
 * no text-search endpoint, so we filter one shared cached index in memory —
 * per the caching guidance, a per-query cache entry would have ~zero hit rate.
 */
export async function GET(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

	const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
	if (query.length < 2) return NextResponse.json([])

	const index = await getArchiveTaskIndex()
	const results = index
		.map((entry) => ({ entry, score: fuzzyScore(query, `${entry.name} ${entry.listName}`) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, MAX_RESULTS)
		.map(({ entry }) => entry)

	return NextResponse.json(results)
}
