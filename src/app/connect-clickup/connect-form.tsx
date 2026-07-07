'use client'

import { useActionState } from 'react'
import { buttonPrimary, inputBase } from '@/components/ui/button-styles'
import { type ConnectClickUpState, connectClickUpAccount } from '@/lib/actions/connect-clickup'

const initialState: ConnectClickUpState = {}

export function ConnectClickUpForm() {
	const [state, formAction, pending] = useActionState(connectClickUpAccount, initialState)

	return (
		<form action={formAction} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
			<label className="block text-sm">
				<span className="mb-1 block font-medium text-zinc-700">Personal API token</span>
				<input name="token" type="password" required autoComplete="off" className={inputBase} />
			</label>
			{state.error && (
				<p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
					{state.error}
				</p>
			)}
			<button type="submit" disabled={pending} className={`${buttonPrimary} w-full justify-center`}>
				{pending ? 'Verifying…' : 'Connect'}
			</button>
		</form>
	)
}
