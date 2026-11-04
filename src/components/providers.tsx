"use client"

import { useEffect } from "react"

import { QueryClientProvider } from "@tanstack/react-query"

import { queryClient } from "@/lib/query-client"
import { useBusinessQuery } from "@/hooks/use-business"
import { useBusinessStore } from "@/stores/business-store"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * Keeps the Zustand business store in sync with TanStack Query, which fetches
 * real business data from `/api/business`. The store no longer performs its
 * own database fetch; this provider is the single data source for real sessions.
 */
export function BusinessDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const ready = useBusinessStore((state) => state.ready)
  const { data, error } = useBusinessQuery({ enabled: true })

  useEffect(() => {
    if (data && !ready) {
      useBusinessStore.setState({
        ...data,
        ready: true,
      })
    }
  }, [data, ready])

  if (error) {
    console.error("Business data query error:", error)
  }

  return children
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <BusinessDataProvider>{children}</BusinessDataProvider>
    </QueryProvider>
  )
}
