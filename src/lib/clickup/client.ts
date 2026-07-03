const BASE_URL = 'https://api.clickup.com/api/v2'

export class ClickUpApiError extends Error {
	status: number

	constructor(message: string, status: number) {
		super(message)
		this.status = status
	}
}

type SearchParamValue = string | number | boolean | string[] | undefined

interface ClickUpRequestOptions {
	token: string
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	body?: unknown
	searchParams?: Record<string, SearchParamValue>
}

function buildSearchParams(params: ClickUpRequestOptions['searchParams']): string {
	if (!params) return ''
	const usp = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) continue
		if (Array.isArray(value)) {
			for (const item of value) usp.append(`${key}[]`, item)
		} else {
			usp.set(key, String(value))
		}
	}
	const qs = usp.toString()
	return qs ? `?${qs}` : ''
}

/** Thin typed fetch wrapper for the ClickUp v2 API — no caching here, see clickup/cached.ts. */
export async function cu<T>(path: string, options: ClickUpRequestOptions): Promise<T> {
	const { token, method = 'GET', body, searchParams } = options
	const url = `${BASE_URL}${path}${buildSearchParams(searchParams)}`

	const response = await fetch(url, {
		method,
		headers: {
			Authorization: token,
			'Content-Type': 'application/json',
		},
		body: body ? JSON.stringify(body) : undefined,
	})

	if (response.status === 429) {
		const retryAfterSeconds = Number(response.headers.get('Retry-After') ?? '1')
		await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000))
		return cu<T>(path, options)
	}

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		throw new ClickUpApiError(`ClickUp API error ${response.status} on ${path}: ${text}`, response.status)
	}

	return response.json() as Promise<T>
}
