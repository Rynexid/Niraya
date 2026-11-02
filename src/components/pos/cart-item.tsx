import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CartLine } from '@/types/pos'

type CartItemProps = {
  line: CartLine
  currency?: string
  onIncrement?: (id: string) => void
  onDecrement?: (id: string) => void
  onRemove?: (id: string) => void
  className?: string
}

/** One editable cart line. Handlers are optional so the component also works read-only. */
export function CartItem({
  line,
  currency = DEFAULT_CURRENCY,
  onIncrement,
  onDecrement,
  onRemove,
  className,
}: CartItemProps) {
  const lineTotal = line.quantity * line.unitPrice

  return (
    <div className={cn('flex gap-3 py-3', className)}>
      <ProductThumbnail
        src={line.imageUrl}
        alt={line.name}
        size="sm"
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{line.name}</p>
            {line.note ? (
              <p className="truncate text-xs text-muted-foreground">
                {line.note}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(line.unitPrice, currency)} each
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(lineTotal, currency)}
            </span>
            {onRemove ? (
              <IconButton
                icon={Trash2Icon}
                label={`Remove ${line.name}`}
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(line.id)}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Decrease quantity of ${line.name}`}
              disabled={!onDecrement || line.quantity <= 1}
              onClick={() => onDecrement?.(line.id)}
              className="rounded-r-none"
            >
              <MinusIcon aria-hidden="true" />
            </Button>
            <span
              aria-live="polite"
              className="w-8 text-center text-sm font-medium tabular-nums"
            >
              {formatNumber(line.quantity)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Increase quantity of ${line.name}`}
              disabled={!onIncrement}
              onClick={() => onIncrement?.(line.id)}
              className="rounded-l-none"
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {line.quantity} × {formatCurrency(line.unitPrice, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
