'use client'

import { Menu } from '@base-ui/react/menu'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { savePushSubscription } from '@/lib/actions/push'
import { authClient } from '@/lib/auth-client'

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

type PushStatus = 'checking' | 'idle' | 'working' | 'enabled' | 'error'

/** Avatar dropdown (Base UI Menu) — account actions + push toggle live here so
 * the header stays a single search affordance + avatar. */
export function UserMenu({ name, clickupUsername }: { name: string; clickupUsername: string }) {
	const router = useRouter()
	const [pushStatus, setPushStatus] = useState<PushStatus>('checking')
	const initials = name
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

	useEffect(() => {
		let cancelled = false
		if (!('serviceWorker' in navigator)) {
			setPushStatus('idle')
			return
		}
		navigator.serviceWorker
			.getRegistration('/sw.js')
			.then((registration) => registration?.pushManager.getSubscription())
			.then((subscription) => {
				if (!cancelled) setPushStatus(subscription ? 'enabled' : 'idle')
			})
			.catch(() => {
				if (!cancelled) setPushStatus('idle')
			})
		return () => {
			cancelled = true
		}
	}, [])

	async function enablePush() {
		setPushStatus('working')
		try {
			const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
			if (!publicKey) throw new Error('Push is not configured')

			const registration = await navigator.serviceWorker.register('/sw.js')
			await navigator.serviceWorker.ready

			const permission = await Notification.requestPermission()
			if (permission !== 'granted') {
				setPushStatus('error')
				return
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			})

			const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
			await savePushSubscription(json, navigator.userAgent)
			setPushStatus('enabled')
		} catch (err) {
			console.error(err)
			setPushStatus('error')
		}
	}

	const pushLabel =
		pushStatus === 'enabled'
			? 'Push notifications on'
			: pushStatus === 'working'
				? 'Enabling push…'
				: pushStatus === 'error'
					? 'Push failed — try again'
					: 'Enable push notifications'

	return (
		<Menu.Root>
			<Menu.Trigger
				className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong transition-shadow hover:ring-2 hover:ring-accent-soft"
				aria-label="Account menu"
			>
				{initials || '?'}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner sideOffset={8} align="end" className="z-50 outline-none">
					<Menu.Popup className="min-w-52 origin-[var(--transform-origin)] rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg outline-none transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
						<div className="border-b border-zinc-100 px-3 pt-1 pb-2">
							<p className="text-sm font-medium text-zinc-900">{name}</p>
							<p className="text-xs text-zinc-500">ClickUp: {clickupUsername}</p>
						</div>
						{pushStatus !== 'checking' && pushStatus !== 'enabled' && (
							<Menu.Item
								className="mx-1.5 mt-1 cursor-pointer rounded-lg px-2 py-1.5 text-sm text-zinc-700 outline-none select-none data-highlighted:bg-zinc-100"
								onClick={enablePush}
								disabled={pushStatus === 'working'}
							>
								{pushLabel}
							</Menu.Item>
						)}
						<Menu.Item
							className="mx-1.5 mt-1 cursor-pointer rounded-lg px-2 py-1.5 text-sm text-zinc-700 outline-none select-none data-highlighted:bg-zinc-100"
							onClick={async () => {
								await authClient.signOut()
								router.push('/sign-in')
								router.refresh()
							}}
						>
							Sign out
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	)
}
