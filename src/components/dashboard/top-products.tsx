import { ExternalLinkIcon, PackageIcon } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { TopProduct } from '@/types/dashboard'

export function TopProducts({
  products,
  className,
}: {
  products: TopProduct[]
  className?: string
}) {
  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-2 p-5 pb-2">
        <div>
          <h2 className="text-sm font-semibold">Top Selling Products</h2>
          <p className="text-xs text-muted-foreground">
            Berdasarkan pendapatan 7 hari terakhir
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link href="/reports">
            <ExternalLinkIcon aria-hidden="true" className="mr-1 size-3.5" />
            View all
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="p-4 pt-2">
          <EmptyState
            icon={PackageIcon}
            title="Belum ada produk terjual"
            description="Selesaikan transaksi di POS untuk melihat produk terlaris."
            className="py-8"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-3 pb-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-accent/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 text-center text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <ProductThumbnail
                  src={product.imageUrl}
                  alt={product.name}
                  size="sm"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-tight">
                    {product.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {product.category ?? 'Tanpa kategori'} ·{' '}
                    {formatNumber(product.unitsSold)} terjual
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium tabular-nums">
                {formatCurrency(product.revenue)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
