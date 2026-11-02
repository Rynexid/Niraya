import { z } from 'zod'

/**
 * Only variables prefixed with `VITE_` are exposed to the browser.
 * Never add database URLs, API secrets or auth secrets here.
 */
const envSchema = z.object({
  VITE_API_URL: z
    .union([z.literal(''), z.url({ error: 'VITE_API_URL must be a valid URL' })])
    .default(''),
  VITE_APP_NAME: z.string().min(1).default('Niraya POS'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
})

/**
 * Base URL for API calls. An empty value means "same origin", which is the
 * recommended production setup (frontend and API behind one reverse proxy).
 */
export const apiBaseUrl = env.VITE_API_URL.replace(/\/$/, '')
