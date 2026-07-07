'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonPrimary, inputBase } from '@/components/ui/button-styles'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
	const router = useRouter()
	const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	async function handleSubmit(formData: FormData) {
		setError(null)
		setPending(true)

		const email = String(formData.get('email'))
		const password = String(formData.get('password'))

		const result =
			mode === 'sign-in'
				? await authClient.signIn.email({ email, password })
				: await authClient.signUp.email({ email, password, name: String(formData.get('name') ?? '') })

		setPending(false)

		if (result.error) {
			setError(result.error.message ?? 'Something went wrong.')
			return
		}

		router.push('/')
		router.refresh()
	}

	return (
		<main className="flex min-h-dvh items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="mb-6 flex items-center gap-2">
					<span className="flex size-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
						⚡
					</span>
					<div>
						<h1 className="font-semibold text-zinc-900">ClickUp Lite</h1>
						<p className="text-xs text-zinc-500">{mode === 'sign-in' ? 'Sign in to continue' : 'Create an account'}</p>
					</div>
				</div>
				<form action={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
					{mode === 'sign-up' && (
						<label className="block text-sm">
							<span className="mb-1 block font-medium text-zinc-700">Name</span>
							<input name="name" required className={inputBase} />
						</label>
					)}
					<label className="block text-sm">
						<span className="mb-1 block font-medium text-zinc-700">Email</span>
						<input name="email" type="email" required className={inputBase} />
					</label>
					<label className="block text-sm">
						<span className="mb-1 block font-medium text-zinc-700">Password</span>
						<input name="password" type="password" required minLength={8} className={inputBase} />
					</label>
					{error && (
						<p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
							{error}
						</p>
					)}
					<button type="submit" disabled={pending} className={`${buttonPrimary} w-full justify-center`}>
						{pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
					</button>
				</form>
				<button
					type="button"
					onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
					className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
				>
					{mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
				</button>
			</div>
		</main>
	)
}
