"use client"

import { useEffect } from "react"

import { QueryClientProvider } from "@tanstack/react-query"

import { createSeedData, BUSINESS_SETTINGS } from "@/lib/business-seed"
import { queryClient } from "@/lib/query-client"
import { useBusinessQuery } from "@/hooks/use-business"
import { useBusinessStore } from "@/stores/business-store"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * Keeps the Zustand business store in sync with TanStack Query, which fetches
 * real business data from `/api/business`. In real mode the store no longer
 * performs its own database fetch; this provider is the single data source.
 *
 * Demo mode continues to use the local seed store persisted in localStorage.
 */
export function BusinessDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const mode = useBusinessStore((state) => state.mode)
  const ready = useBusinessStore((state) => state.ready)
  const { data, error } = useBusinessQuery({ enabled: mode === "real" })

  useEffect(() => {
    if (mode === "demo" && !ready) {
      useBusinessStore.setState({
        ...createSeedData(),
        mode: "demo",
        ready: true,
      })
      return
    }

    if (mode === "real" && data) {
      useBusinessStore.setState({
        ...data,
        mode: "real",
        ready: true,
      })
    }
  }, [mode, data, ready])

  if (mode === "real" && error) {
    console.error("Business data query error:", error)
    useBusinessStore.setState({
      categories: [],
      products: [],
      customers: [],
      staff: [],
      transactions: [],
      movements: [],
      settings: BUSINESS_SETTINGS,
      mode: "real",
      ready: true,
    })
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
