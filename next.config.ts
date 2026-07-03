import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactCompiler: true,
	cacheComponents: true,
	cacheHandlers: {
		// Neon-backed durable cache for 'use cache: remote' — see cache-handlers/remote-handler.js
		// for why this is needed (Netlify doesn't provide one automatically).
		remote: require.resolve('./cache-handlers/remote-handler.js'),
	},
}

export default nextConfig
