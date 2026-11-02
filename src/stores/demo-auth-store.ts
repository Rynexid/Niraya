import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEMO_ACCOUNT, signInDemo } from '@/lib/demo-account'

export type DemoSession = {
  name: string
  email: string
  role: string
  signedInAt: string
}

type SignInResult =
  | { ok: true }
  | { ok: false; reason: string }

type DemoAuthState = {
  session: DemoSession | null
  signIn: (email: string, password: string) => SignInResult
  signOut: () => void
}

/**
 * Frontend-only demo session.
 *
 * This is deliberately not real authentication: it only unlocks the demo UI in
 * this browser and is never used to protect server data. The Hono API already
 * has Better Auth wired for the production flow.
 */
export const useDemoAuthStore = create<DemoAuthState>()(
  persist(
    (set) => ({
      session: null,

      signIn: (email, password) => {
        if (!signInDemo(email, password)) {
          return {
            ok: false,
            reason: 'Email atau kata sandi demo tidak cocok.',
          }
        }

        set({
          session: {
            name: DEMO_ACCOUNT.name,
            email: DEMO_ACCOUNT.email,
            role: DEMO_ACCOUNT.role,
            signedInAt: new Date().toISOString(),
          },
        })

        return { ok: true }
      },

      signOut: () => set({ session: null }),
    }),
    {
      name: 'niraya.demo-session.v1',
    },
  ),
)
