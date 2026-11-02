import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const sizeStyles = {
  sm: 'text-sm',
  default: 'text-base',
  lg: 'text-lg',
} as const

type ProductPriceProps = {
  amount: number
  currency?: string
  /** Original price shown struck through when discounted. */
  compareAt?: number
  size?: keyof typeof sizeStyles
  className?: string
}

/** Monetary value with tabular numerals for stable alignment. */
export function ProductPrice({
  amount,
  currency = DEFAULT_CURRENCY,
  compareAt,
  size = 'default',
  className,
}: ProductPriceProps) {
  const showCompareAt =
    typeof compareAt === 'number' && compareAt > amount

  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums',
        className,
      )}
    >
      <span className={cn('font-semibold text-foreground', sizeStyles[size])}>
        {formatCurrency(amount, currency)}
      </span>
      {showCompareAt ? (
        <span className="text-xs text-muted-foreground line-through">
          {formatCurrency(compareAt, currency)}
        </span>
      ) : null}
    </span>
  )
}
