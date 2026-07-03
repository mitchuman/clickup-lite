import { cu } from '../src/lib/clickup/client'
import { db } from '../src/lib/db'
import { env } from '../src/lib/env'

const EVENTS = [
	'taskCreated',
	'taskUpdated',
	'taskDeleted',
	'taskMoved',
	'taskAssigneeUpdated',
	'taskDueDateUpdated',
	'taskPriorityUpdated',
	'taskStatusUpdated',
	'taskCommentPosted',
	'taskCommentUpdated',
]

interface CreateWebhookResponse {
	id: string
	webhook: {
		id: string
		secret: string
		endpoint: string
		events: string[]
	}
}

async function main() {
	const endpoint = process.argv[2]
	if (!endpoint) {
		console.error('Usage: bun scripts/register-webhook.ts <endpoint-url>')
		console.error('Example: bun scripts/register-webhook.ts https://clickup-lite.netlify.app/api/webhooks/clickup')
		process.exit(1)
	}

	const response = await cu<CreateWebhookResponse>(`/team/${env.clickupTeamId}/webhook`, {
		token: env.clickupServiceToken,
		method: 'POST',
		body: { endpoint, events: EVENTS },
	})

	await db
		.insertInto('webhook_state')
		.values({
			clickup_webhook_id: response.webhook.id,
			team_id: env.clickupTeamId,
			endpoint_url: endpoint,
			secret: response.webhook.secret,
			events: JSON.stringify(EVENTS),
		})
		.execute()

	console.log(`Webhook registered: ${response.webhook.id}`)
	console.log('Add this to .env.local and to Netlify env vars:')
	console.log(`CLICKUP_WEBHOOK_SECRET=${response.webhook.secret}`)

	await db.destroy()
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
