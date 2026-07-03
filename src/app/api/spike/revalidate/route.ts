import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	const immediate = new URL(request.url).searchParams.get('immediate') === '1'
	revalidateTag('spike', immediate ? { expire: 0 } : 'max')
	return NextResponse.json({ revalidated: true, immediate, now: Date.now() })
}
