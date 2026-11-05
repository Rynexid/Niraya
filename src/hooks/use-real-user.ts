'use client'

import { useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'

type RealUser = {
  name?: string
  email?: string
  role?: string
  image?: string | null
} | null

type SessionUser = NonNullable<RealUser>

/**
 * Loads the signed-in Neon Auth user plus the app role from
 * `core.UserProfiles` (via `/api/me`). New accounts default to `user`.
 */
export function useRealUser(enabled: boolean) {
  const [user, setUser] = useState<RealUser>(null)

  useEffect(() => {
    if (!enabled) return

    let active = true

    const load = async () => {
      try {
        const result: any = await authClient.getSession()
        if (!active) return

        const sessionUser: SessionUser | null =
          result?.data?.user ?? result?.user ?? null

        if (!sessionUser) {
          setUser(null)
          return
        }

        try {
          const response = await fetch('/api/me', {
            cache: 'no-store',
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            if (active && data?.user) {
              setUser(data.user)
              return
            }
          }
        } catch {
          // Abaikan; fallback ke data sesi Neon Auth di bawah.
        }

        if (active) setUser(sessionUser)
      } catch {
        if (active) setUser(null)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [enabled])

  return user
}
