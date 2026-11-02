import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'destructive' | 'info'

const TONE_CLASSES: Record<Tone, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: Tone
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          TONE_CLASSES[tone],
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
    </div>
  )
}
