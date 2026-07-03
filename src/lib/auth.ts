import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export const auth = betterAuth({
	baseURL: env.betterAuthUrl,
	secret: env.betterAuthSecret,
	database: { db, type: 'postgres', transaction: true },
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()],
})
