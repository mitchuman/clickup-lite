'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
		<main>
			<h1>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h1>
			<form action={handleSubmit}>
				{mode === 'sign-up' && (
					<label>
						Name
						<input name="name" required />
					</label>
				)}
				<label>
					Email
					<input name="email" type="email" required />
				</label>
				<label>
					Password
					<input name="password" type="password" required minLength={8} />
				</label>
				{error && <p role="alert">{error}</p>}
				<button type="submit" disabled={pending}>
					{pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
				</button>
			</form>
			<button type="button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
				{mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
			</button>
		</main>
	)
}
