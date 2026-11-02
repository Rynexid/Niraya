"use client";

import { useRouter } from 'next/navigation'
import {
  ArchiveIcon,
  ArrowUpRightIcon,
  BarcodeIcon,
  BoxesIcon,
  CalendarIcon,
  PencilIcon,
  ReceiptTextIcon,
  TagIcon,
  TrendingUpIcon,
} from 'lucide-react'

import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { StatusBadge } from '@/components/shared/status-badge'
import { StockBadge } from '@/components/shared/stock-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getProductSales } from '@/lib/business-selectors'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import type { Category, Product, Transaction } from '@/types/business'

export function ProductDetailSheet({
  product,
  categories,
  transactions,
  open,
  onOpenChange,
  onEdit,
}: {
  product: Product | null
  categories: readonly Category[]
  transactions: readonly Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (product: Product) => void
}) {
  const router = useRouter()
  const category = categories.find((item) => item.id === product?.categoryId)
  const sales = product
    ? getProductSales(transactions, product.id)
    : { unitsSold: 0, revenue: 0, transactionCount: 0 }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {product ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3 pr-8">
                <ProductThumbnail
                  src={product.imageUrl}
                  alt={product.name}
                  size="lg"
                />
                <div className="min-w-0">
                  <SheetTitle className="truncate">{product.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {product.sku} · {category?.name ?? 'Tanpa kategori'}
                  </SheetDescription>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={product.status} />
                    <StockBadge
                      stock={product.stock}
                      minStock={product.minStock}
                    />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Harga jual</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Harga modal</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(product.cost)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {product.price === 0
                      ? '—'
                      : `${Math.round(((product.price - product.cost) / product.price) * 100)}%`}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Stok</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatNumber(product.stock)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {product.unit}
                    </span>
                  </p>
                </div>
              </div>

              <dl className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
                <DetailRow icon={TagIcon} label="Kategori">
                  {category?.name ?? '—'}
                </DetailRow>
                <DetailRow icon={BarcodeIcon} label="Barcode">
                  {product.barcode ?? '—'}
                </DetailRow>
                <DetailRow icon={BoxesIcon} label="Stok minimum">
                  {formatNumber(product.minStock)} {product.unit}
                </DetailRow>
                <DetailRow icon={CalendarIcon} label="Ditambahkan">
                  {formatDate(product.createdAt)}
                </DetailRow>
              </dl>

              <h3 className="mt-5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Performa penjualan
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border p-3 text-center">
                  <TrendingUpIcon
                    aria-hidden="true"
                    className="mx-auto size-4 text-primary"
                  />
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {formatNumber(sales.unitsSold)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Terjual</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <ReceiptTextIcon
                    aria-hidden="true"
                    className="mx-auto size-4 text-primary"
                  />
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {formatNumber(sales.transactionCount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Transaksi</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    className="mx-auto size-4 text-primary"
                  />
                  <p className="mt-1 truncate text-base font-semibold tabular-nums">
                    {formatCurrency(sales.revenue)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Pendapatan</p>
                </div>
              </div>

              {product.status === 'archived' ? (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  <ArchiveIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Produk ini diarsipkan dan tidak muncul di katalog POS.
                </p>
              ) : null}
            </div>

            <SheetFooter className="border-t">
              <Button
                variant="outline"
                onClick={() => router.push(`/inventory?product=${product.id}`)}
              >
                <BoxesIcon aria-hidden="true" />
                Sesuaikan stok
              </Button>
              <Button onClick={() => onEdit(product)}>
                <PencilIcon aria-hidden="true" />
                Edit produk
              </Button>
            </SheetFooter>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Produk tidak ditemukan</SheetTitle>
            <SheetDescription>
              Pilih produk dari daftar untuk melihat detailnya.
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof TagIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd className="truncate text-sm font-medium">{children}</dd>
    </div>
  )
}
