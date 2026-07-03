import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '@/lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey() {
	const key = Buffer.from(env.tokenEncryptionKey, 'base64')
	if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
	return key
}

/** Encrypts a secret (e.g. a ClickUp personal token) for storage at rest. */
export function encrypt(plaintext: string): string {
	const iv = randomBytes(IV_LENGTH)
	const cipher = createCipheriv(ALGORITHM, getKey(), iv)
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
	const authTag = cipher.getAuthTag()
	return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

export function decrypt(payload: string): string {
	const raw = Buffer.from(payload, 'base64')
	const iv = raw.subarray(0, IV_LENGTH)
	const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
	const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
	const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
	decipher.setAuthTag(authTag)
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
