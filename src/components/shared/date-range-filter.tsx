import { CalendarIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-background px-2.5',
        className,
      )}
    >
      <CalendarIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <Input
        type="date"
        value={from}
        max={to || undefined}
        aria-label="Tanggal mulai"
        onChange={(event) => onFromChange(event.target.value)}
        className="h-9 w-[132px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
      <span aria-hidden="true" className="text-xs text-muted-foreground">
        –
      </span>
      <Input
        type="date"
        value={to}
        min={from || undefined}
        aria-label="Tanggal akhir"
        onChange={(event) => onToChange(event.target.value)}
        className="h-9 w-[132px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
