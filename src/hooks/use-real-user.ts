'use client'

import { useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'

type RealUser = {
  name?: string
  email?: string
  role?: string
} | null

/**
 * Loads the signed-in Neon Auth user for real (non-demo) sessions.
 */
export function useRealUser(enabled: boolean) {
  const [user, setUser] = useState<RealUser>(null)

  useEffect(() => {
    if (!enabled) return

    let active = true
    authClient
      .getSession()
      .then((result: any) => {
        if (!active) return
        setUser(result?.data?.user ?? result?.user ?? null)
      })
      .catch(() => {
        if (active) setUser(null)
      })

    return () => {
      active = false
    }
  }, [enabled])

  return user
}
