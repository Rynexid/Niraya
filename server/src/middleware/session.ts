import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

import { auth } from '../lib/auth'

export type AppEnv = {
  Variables: {
    session: typeof auth.$Infer.Session | null
    auth: NonNullable<typeof auth.$Infer.Session>
  }
}

/**
 * Resolves the Better Auth session (if any) and exposes it on the Hono context.
 * Cookies are read from the raw request, so this works for browser clients
 * using `credentials: "include"`.
 */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  c.set('session', session)

  await next()
})

/**
 * Rejects unauthenticated requests. Use after `sessionMiddleware`.
 */
export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const session = c.get('session')

  if (!session) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  c.set('auth', session)

  await next()
})
