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
  quantities?: Record<string, number>
  onCategoryChange: (categoryId: string) => void
  onAdd: (product: PosProduct) => void
  className?: string
}

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
          const Icon = category.icon as any
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {Icon && typeof Icon === 'function' ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
              <span className="whitespace-nowrap">{category.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                  active ? 'bg-primary/15' : 'bg-background/80',
                )}
              >
                {formatNumber(category.count)}
              </span>
            </button>
          )
        })}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <SearchXIcon className="size-9 text-muted-foreground" />
          <p className="text-sm font-semibold">Produk tidak ditemukan</p>
          <p className="text-xs text-muted-foreground">
            Coba ubah kata kunci atau filter kategori.
          </p>
        </div>
      ) : (
        <div className="custom-scrollbar grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
  )
}
