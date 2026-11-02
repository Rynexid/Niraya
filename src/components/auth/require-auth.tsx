import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useDemoAuthStore } from '@/stores/demo-auth-store'

/**
 * Redirects to the demo login when no local session exists. This is a UI gate
 * for the preview build only; real authorization belongs on the API.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useDemoAuthStore((state) => state.session)
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return children
}
