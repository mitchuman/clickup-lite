'use client'

import { useActionState } from 'react'
import { type ConnectClickUpState, connectClickUpAccount } from '@/lib/actions/connect-clickup'

const initialState: ConnectClickUpState = {}

export function ConnectClickUpForm() {
	const [state, formAction, pending] = useActionState(connectClickUpAccount, initialState)

	return (
		<form action={formAction}>
			<label>
				Personal API token
				<input name="token" type="password" required autoComplete="off" />
			</label>
			{state.error && <p role="alert">{state.error}</p>}
			<button type="submit" disabled={pending}>
				{pending ? 'Verifying…' : 'Connect'}
			</button>
		</form>
	)
}
