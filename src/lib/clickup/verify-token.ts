import { env } from '@/lib/env'

interface ClickUpUser {
	id: number
	username: string
	email: string
}

interface ClickUpTeam {
	id: string
	name: string
}

export class ClickUpTokenError extends Error {}

export interface VerifiedClickUpAccount {
	clickupUserId: string
	clickupUsername: string
	clickupEmail: string
}

/** Confirms a pasted personal token is valid and belongs to a member of CLICKUP_TEAM_ID. */
export async function verifyClickUpToken(token: string): Promise<VerifiedClickUpAccount> {
	const userRes = await fetch('https://api.clickup.com/api/v2/user', {
		headers: { Authorization: token },
	})
	if (!userRes.ok) {
		throw new ClickUpTokenError(
			userRes.status === 401
				? "That token was rejected by ClickUp — check it and try again."
				: 'Could not verify the token with ClickUp.',
		)
	}
	const { user } = (await userRes.json()) as { user: ClickUpUser }

	const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
		headers: { Authorization: token },
	})
	if (!teamRes.ok) {
		throw new ClickUpTokenError('Could not verify workspace membership with ClickUp.')
	}
	const { teams } = (await teamRes.json()) as { teams: ClickUpTeam[] }

	const isMember = teams.some((team) => team.id === env.clickupTeamId)
	if (!isMember) {
		throw new ClickUpTokenError('This ClickUp account is not a member of the required workspace.')
	}

	return {
		clickupUserId: String(user.id),
		clickupUsername: user.username,
		clickupEmail: user.email,
	}
}
