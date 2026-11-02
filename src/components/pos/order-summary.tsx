import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type OrderSummaryProps = {
  /** Number of line items, shown next to the subtotal label. */
  itemCount?: number
  subtotal: number
  discount?: number
  tax?: number
  total: number
  currency?: string
  title?: string
  /** Slot for the primary action, e.g. a checkout button. */
  footer?: ReactNode
  className?: string
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: ReactNode
  value: string
  tone?: 'muted' | 'success'
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-sm font-medium tabular-nums',
          tone === 'muted' && 'font-normal text-muted-foreground',
          tone === 'success' && 'text-success',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/** Totals panel shared by the cart and checkout screens. */
export function OrderSummary({
  itemCount,
  subtotal,
  discount,
  tax,
  total,
  currency = DEFAULT_CURRENCY,
  title = 'Order summary',
  footer,
  className,
}: OrderSummaryProps) {
  return (
    <section
      aria-label={title}
      className={cn('rounded-lg border bg-card', className)}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        <dl className="flex flex-col gap-2.5">
          <SummaryRow
            label={
              typeof itemCount === 'number'
                ? `Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`
                : 'Subtotal'
            }
            value={formatCurrency(subtotal, currency)}
          />
          {typeof discount === 'number' && discount > 0 ? (
            <SummaryRow
              label="Discount"
              value={`-${formatCurrency(discount, currency)}`}
              tone="success"
            />
          ) : null}
          {typeof tax === 'number' && tax > 0 ? (
            <SummaryRow label="Tax" value={formatCurrency(tax, currency)} />
          ) : null}
        </dl>
        <Separator className="my-1" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-base font-semibold tabular-nums">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      {footer ? (
        <div className="border-t px-4 py-3">{footer}</div>
      ) : null}
    </section>
  )
}
