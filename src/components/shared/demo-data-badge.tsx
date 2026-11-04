'use client'

import { DatabaseIcon, ShieldCheckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useBusinessStore } from '@/stores/business-store'

/**
 * Marks which data source the current screen is using. Demo sessions read
 * from the in-browser store, while real sessions read from the database.
 */
export function DemoDataBadge() {
  const mode = useBusinessStore((state) => state.mode)

  if (mode === 'real') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
        title="Data tersimpan di database dan tersinkron dengan server."
      >
        <ShieldCheckIcon aria-hidden="true" className="size-3" />
        Data real
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 text-[10px] font-medium text-muted-foreground"
      title="Data contoh tersimpan di browser ini, bukan data server."
    >
      <DatabaseIcon aria-hidden="true" className="size-3" />
      Data demo
    </Badge>
  )
}
