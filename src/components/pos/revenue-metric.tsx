import {
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type Trend = 'up' | 'down' | 'flat'

type RevenueMetricProps = {
  label: string
  value: number
  /** Render the value as currency (default) or a plain count. */
  format?: 'currency' | 'number'
  currency?: string
  /** Percentage change against the comparison period. */
  change?: number
  trend?: Trend
  period?: string
  icon?: LucideIcon
  loading?: boolean
  className?: string
}

const trendStyles: Record<Trend, string> = {
  up: 'text-success',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
}

const trendIcons: Record<Trend, LucideIcon> = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
  flat: MinusIcon,
}

function resolveTrend(change: number | undefined, trend?: Trend): Trend {
  if (trend) return trend
  if (typeof change !== 'number' || change === 0) return 'flat'
  return change > 0 ? 'up' : 'down'
}

/** KPI tile for revenue and sales summaries. */
export function RevenueMetric({
  label,
  value,
  format = 'currency',
  currency = DEFAULT_CURRENCY,
  change,
  trend,
  period = 'vs previous period',
  icon: Icon,
  loading = false,
  className,
}: RevenueMetricProps) {
  const resolvedTrend = resolveTrend(change, trend)
  const TrendIcon = trendIcons[resolvedTrend]

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {format === 'number'
              ? formatNumber(value)
              : formatCurrency(value, currency)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {typeof change === 'number' ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
                  trendStyles[resolvedTrend],
                )}
              >
                <TrendIcon aria-hidden="true" className="size-3.5" />
                {Math.abs(change).toFixed(1)}%
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
        </>
      )}
    </div>
  )
}
