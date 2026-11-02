import { LOW_STOCK_THRESHOLD } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import { StatusIndicator } from '@/components/data-display/status-indicator'

type StockIndicatorProps = {
  /** Units available. Zero (or less) means out of stock. */
  stock: number
  threshold?: number
  /** Show the remaining quantity instead of a generic label. */
  showCount?: boolean
  className?: string
}

/**
 * Stock state as text plus color. Color alone never conveys the state, which
 * keeps it usable for color-blind users and screen readers.
 */
export function StockIndicator({
  stock,
  threshold = LOW_STOCK_THRESHOLD,
  showCount = true,
  className,
}: StockIndicatorProps) {
  const safeStock = Math.max(0, stock)

  if (safeStock === 0) {
    return (
      <StatusIndicator
        tone="destructive"
        label="Out of stock"
        size="sm"
        className={className}
      />
    )
  }

  if (safeStock <= threshold) {
    return (
      <StatusIndicator
        tone="warning"
        label={`${formatNumber(safeStock)} left`}
        size="sm"
        className={cn('tabular-nums', className)}
      />
    )
  }

  return (
    <StatusIndicator
      tone="success"
      label={showCount ? `${formatNumber(safeStock)} in stock` : 'In stock'}
      size="sm"
      className={cn('tabular-nums', className)}
    />
  )
}
