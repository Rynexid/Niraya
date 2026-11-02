import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db'

export const healthRoutes = new Hono()
  .get('/', (c) =>
    c.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  )
  .get('/ready', async (c) => {
    try {
      await db.execute(sql`select 1`)

      return c.json({ status: 'ready', database: 'up' })
    } catch (error) {
      console.error('[api] database readiness check failed', error)

      return c.json({ status: 'unavailable', database: 'down' }, 503)
    }
  })
