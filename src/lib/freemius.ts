import "server-only"

import { Freemius } from "@freemius/sdk"

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

/**
 * Server-only Freemius client.
 *
 * Never import this module from a client component: it uses the secret key
 * and must stay on the server.
 */
export const freemius = new Freemius({
  productId: requireEnv("FREEMIUS_PRODUCT_ID"),
  apiKey: requireEnv("FREEMIUS_API_KEY"),
  secretKey: requireEnv("FREEMIUS_SECRET_KEY"),
  publicKey: requireEnv("FREEMIUS_PUBLIC_KEY"),
})
