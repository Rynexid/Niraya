"use client";

import { BanIcon, PlusIcon } from 'lucide-react'

import { ProductPrice } from '@/components/pos/product-price'
import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PosProduct } from '../data/catalog'

type PosProductCardProps = {
  product: PosProduct
  /** Units already in the current order, shown as a badge on the add button. */
  quantity?: number
  onAdd: (product: PosProduct) => void
  className?: string
}

/** Catalogue tile for the POS grid: image, availability, name and price. */
export function PosProductCard({
  product,
  quantity = 0,
  onAdd,
  className,
}: PosProductCardProps) {
  const outOfStock = product.stock !== undefined && product.stock <= 0

  return (
    <article
      className={cn(
        'group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-3 transition-colors',
        outOfStock ? 'opacity-60' : 'hover:border-primary/40',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={outOfStock}
        aria-label={`Pilih ${product.name}`}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
      >
        <div className="relative mb-2.5 overflow-hidden rounded-lg bg-muted">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="square"
            className={cn(
              'rounded-lg border-0 [&>img]:transition-transform [&>img]:duration-300',
              !outOfStock && 'group-hover:[&>img]:scale-105',
              outOfStock && 'opacity-70 grayscale',
            )}
          />
          <span
            className={cn(
              'absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm',
              outOfStock ? 'text-destructive' : 'text-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                outOfStock ? 'bg-destructive' : 'bg-success',
              )}
            />
            {outOfStock
              ? 'Stok Habis'
              : `Tersedia (${formatNumber(product.stock ?? 0)})`}
          </span>
        </div>

        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {product.category}
        </p>
        <h3 className="truncate text-sm font-semibold text-foreground">
          {product.name}
        </h3>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <ProductPrice
          amount={product.price}
          size="sm"
          className={cn(
            'min-w-0',
            outOfStock && 'line-through [&>span]:text-muted-foreground',
          )}
        />

        {outOfStock ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <BanIcon aria-hidden="true" className="size-3.5" />
            Habis
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product)}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95"
          >
            <PlusIcon aria-hidden="true" className="size-5" />
            {quantity > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground tabular-nums ring-2 ring-card"
              >
                {formatNumber(quantity)}
              </span>
            ) : null}
          </button>
        )}
      </div>
    </article>
  )
}
