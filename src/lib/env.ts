function requireEnv(name: string): string {
	const value = process.env[name]
	if (!value) throw new Error(`Missing required environment variable: ${name}`)
	return value
}

/**
 * Typed, lazy env access — each field only throws when actually read, so a
 * route that doesn't need e.g. push notifs still works before VAPID keys exist.
 */
export const env = {
	// core / db / auth
	get databaseUrl() {
		return requireEnv('DATABASE_URL')
	},
	get betterAuthSecret() {
		return requireEnv('BETTER_AUTH_SECRET')
	},
	get betterAuthUrl() {
		return requireEnv('BETTER_AUTH_URL')
	},
	// AES-256-GCM key (base64) for encrypting per-user ClickUp personal tokens at rest
	get tokenEncryptionKey() {
		return requireEnv('TOKEN_ENCRYPTION_KEY')
	},

	// clickup
	get clickupTeamId() {
		return requireEnv('CLICKUP_TEAM_ID')
	},
	get clickupServiceToken() {
		return requireEnv('CLICKUP_SERVICE_TOKEN')
	},
	// written by scripts/register-webhook.ts after the webhook is registered
	get clickupWebhookSecret() {
		return process.env.CLICKUP_WEBHOOK_SECRET
	},

	// push notifications (phase 3)
	get vapidPublicKey() {
		return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
	},
	get vapidPrivateKey() {
		return process.env.VAPID_PRIVATE_KEY
	},
	get vapidSubject() {
		return process.env.VAPID_SUBJECT
	},

	// github (phase 5-6)
	get githubToken() {
		return process.env.GITHUB_TOKEN
	},
	get githubOrg() {
		return process.env.GITHUB_ORG
	},

	// deploy webhooks (phase 5)
	get netlifyWebhookJwsSecret() {
		return process.env.NETLIFY_WEBHOOK_JWS_SECRET
	},
	get vercelWebhookSecret() {
		return process.env.VERCEL_WEBHOOK_SECRET
	},
	get deployWebhookToken() {
		return process.env.DEPLOY_WEBHOOK_TOKEN
	},
}
