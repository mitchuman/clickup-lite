// Take over immediately on update instead of waiting for all tabs to close —
// matters for an actively-developed app where we need new SW code live fast.
self.addEventListener('install', () => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
	console.log('[sw] push event received', event.data && event.data.text())

	if (!event.data) return

	let payload
	try {
		payload = event.data.json()
	} catch (err) {
		console.error('[sw] failed to parse push payload', err)
		return
	}

	event.waitUntil(
		self.registration
			.showNotification(payload.title, {
				body: payload.body,
				icon: payload.icon ?? '/favicon.ico',
				data: { url: payload.url ?? '/' },
			})
			.then(() => console.log('[sw] showNotification resolved'))
			.catch((err) => console.error('[sw] showNotification failed', err)),
	)
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const url = event.notification.data?.url ?? '/'

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url === url && 'focus' in client) {
					return client.focus()
				}
			}
			if (self.clients.openWindow) {
				return self.clients.openWindow(url)
			}
		}),
	)
})
