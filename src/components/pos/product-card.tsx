import { PlusIcon } from 'lucide-react'

import { ProductPrice } from '@/components/pos/product-price'
import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { StockIndicator } from '@/components/pos/stock-indicator'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/pos'

type ProductCardProps = {
  product: Product
  /** Called when the product is selected. The card stays read-only without it. */
  onSelect?: (product: Product) => void
  disabled?: boolean
  className?: string
}

/**
 * Catalogue card for the POS grid. The visual is deliberately flat: image,
 * name, price and stock. No workflow logic lives here.
 */
export function ProductCard({
  product,
  onSelect,
  disabled,
  className,
}: ProductCardProps) {
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const isDisabled = disabled || isOutOfStock
  const selectable = Boolean(onSelect)

  return (
    <Card
      size="sm"
      className={cn(
        'gap-0 overflow-hidden py-0 transition-colors hover:border-foreground/20',
        isDisabled && 'opacity-60',
        className,
      )}
    >
      {selectable ? (
        <button
          type="button"
          onClick={() => onSelect?.(product)}
          disabled={isDisabled}
          aria-label={`Select ${product.name}`}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 disabled:cursor-not-allowed"
        >
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="fill"
            className="rounded-none border-0 border-b"
          />
        </button>
      ) : (
        <ProductThumbnail
          src={product.imageUrl}
          alt={product.name}
          size="fill"
          className="rounded-none border-0 border-b"
        />
      )}

      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          {product.category ? (
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {product.category}
            </p>
          ) : null}
          <p className="truncate text-sm font-medium">{product.name}</p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <ProductPrice
              amount={product.price}
              compareAt={product.compareAtPrice}
              size="sm"
            />
            {product.stock !== undefined ? (
              <StockIndicator stock={product.stock} />
            ) : null}
          </div>
          {selectable ? (
            <IconButton
              icon={PlusIcon}
              label={`Add ${product.name} to cart`}
              variant="outline"
              size="sm"
              disabled={isDisabled}
              onClick={() => onSelect?.(product)}
            />
          ) : null}
        </div>
      </div>
    </Card>
  )
}
