import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/sign-in']

// Optimistic check only (cookie presence, not validity) — real authz and the
// ClickUp-connection gate happen in requireUser() (src/lib/session.ts).
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
		return NextResponse.next()
	}

	if (!getSessionCookie(request)) {
		return NextResponse.redirect(new URL('/sign-in', request.url))
	}

	return NextResponse.next()
}

export const config = {
	// Excludes all of /api/* — auth's own catch-all handles its own routing,
	// and route handlers like /api/webhooks/* authenticate via signature
	// verification, not the session cookie, so they must never hit this gate.
	matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
}
