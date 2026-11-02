"use client";

import { SearchXIcon } from 'lucide-react'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PosCategory, PosProduct } from '../data/catalog'
import { PosProductCard } from './product-card'

type ProductCatalogProps = {
  products: PosProduct[]
  categories: PosCategory[]
  activeCategory: string
  /** Quantity per product id already in the order. */
  quantities?: Record<string, number>
  onCategoryChange: (categoryId: string) => void
  onAdd: (product: PosProduct) => void
  className?: string
}

/** Category pills plus the scrollable product grid. */
export function ProductCatalog({
  products,
  categories,
  activeCategory,
  quantities,
  onCategoryChange,
  onAdd,
  className,
}: ProductCatalogProps) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <div
        role="group"
        aria-label="Filter kategori"
        className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar"
      >
        {categories.map((category) => {
          const active = category.id === activeCategory
          const Icon = category.icon

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{category.label}</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {formatNumber(category.count)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar">
        {products.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
            <SearchXIcon
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
            <p className="text-sm font-medium">Produk tidak ditemukan</p>
            <p className="text-xs text-muted-foreground">
              Coba kata kunci atau kategori lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => (
              <PosProductCard
                key={product.id}
                product={product}
                quantity={quantities?.[product.id] ?? 0}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
