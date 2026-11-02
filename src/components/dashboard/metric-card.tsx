import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string | number
  unit?: string
  change?: number
  trend?: 'up' | 'down' | 'flat'
  icon: LucideIcon
  sparkline?: string
  color?: 'primary' | 'success' | 'warning' | 'info'
  period?: string
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  change,
  trend,
  icon: Icon,
  sparkline,
  color = 'primary',
  period,
  className,
}: MetricCardProps) {
  const resolvedTrend =
    trend ?? (change === 0 || change === undefined ? 'flat' : change > 0 ? 'up' : 'down')
  const trendColor = resolvedTrend === 'up' ? 'text-success' : resolvedTrend === 'down' ? 'text-destructive' : 'text-muted-foreground'
  const arrow = resolvedTrend === 'up' ? '↑' : resolvedTrend === 'down' ? '↓' : '→'

  const colorConfig: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    info: { bg: 'bg-info/10', text: 'text-info' },
  }
  const { bg, text } = colorConfig[color]

  return (
    <div
      className={cn(
        'flex flex-col justify-between p-5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={cn('flex size-8 items-center justify-center rounded-lg', bg, text)}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
            {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {change !== undefined ? (
              <span className={cn('font-medium', trendColor)}>
                {arrow} {Math.abs(change)}%
              </span>
            ) : null}
            {period ? <span className="text-muted-foreground">{period}</span> : null}
          </div>
        </div>
        {sparkline ? (
          <svg width="80" height="32" viewBox="0 0 80 32" className="text-muted-foreground/60">
            <polyline points={sparkline} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </div>
  )
}
