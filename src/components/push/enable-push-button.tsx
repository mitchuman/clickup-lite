'use client'

import { useState } from 'react'
import { savePushSubscription } from '@/lib/actions/push'

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

type Status = 'idle' | 'working' | 'enabled' | 'error'

export function EnablePushButton() {
	const [status, setStatus] = useState<Status>('idle')

	async function enable() {
		setStatus('working')
		try {
			const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			if (!publicKey) throw new Error('Push is not configured')

			const registration = await navigator.serviceWorker.register('/sw.js')
			await navigator.serviceWorker.ready

			const permission = await Notification.requestPermission()
			if (permission !== 'granted') {
				setStatus('error')
				return
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			})

			const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
			await savePushSubscription(json, navigator.userAgent)
			setStatus('enabled')
		} catch (err) {
			console.error(err)
			setStatus('error')
		}
	}

	if (status === 'enabled') return <span>Push notifications enabled</span>

	return (
		<button type="button" onClick={enable} disabled={status === 'working'}>
			{status === 'working' ? 'Enabling…' : status === 'error' ? 'Failed — try again' : 'Enable push notifications'}
		</button>
	)
}
