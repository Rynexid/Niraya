/**
 * Read environment variables in a Bun-compatible way without depending on
 * @types/node or @types/bun type definitions (which fail to resolve on
 * some Vercel / TypeScript environments).
 */
const rawEnv =
  (globalThis as { Bun?: { env?: Record<string, string | undefined> } })
    ?.Bun?.env ??
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    ?.process?.env ??
  {}

/** Get an environment variable with a fallback. */
export function env(key: string, fallback: string = ''): string {
  const value = rawEnv[key]
  return typeof value === 'string' ? value : fallback
}
