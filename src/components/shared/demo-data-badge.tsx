import { DatabaseIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

/**
 * Marks screens that are backed by the in-browser demo store rather than the
 * API. Keeps sample data clearly distinguishable from real records.
 */
export function DemoDataBadge() {
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
