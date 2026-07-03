import { Suspense } from 'react'
import { getSpikeValue } from '@/lib/spike/cached-value'

async function SpikeValue() {
	const value = await getSpikeValue()
	return (
		<dl>
			<dt>id</dt>
			<dd>{value.id}</dd>
			<dt>generatedAt</dt>
			<dd>{value.generatedAt}</dd>
		</dl>
	)
}

export default function SpikePage() {
	return (
		<main>
			<h1>Cache spike</h1>
			<p>
				This value comes from a <code>&apos;use cache: remote&apos;</code> function backed by the Neon cache
				handler (cache-handlers/remote-handler.js). Reload — the id should stay the same across requests
				(and across separate serverless instances once deployed). POST to <code>/api/spike/revalidate</code>{' '}
				to bust it, then reload — the id should change.
			</p>
			<Suspense fallback={<p>loading…</p>}>
				<SpikeValue />
			</Suspense>
		</main>
	)
}
