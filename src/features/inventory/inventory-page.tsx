"use client";

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangleIcon,
  BoxesIcon,
  ClipboardListIcon,
  PackageIcon,
  SlidersHorizontalIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DemoDataBadge } from '@/components/shared/demo-data-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterSelect } from '@/components/shared/filter-select'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusBadge } from '@/components/shared/status-badge'
import { StockBadge } from '@/components/shared/stock-badge'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePagination } from '@/hooks/use-pagination'
import {
  getCategoryName,
  isLowStock,
  isOutOfStock,
} from '@/lib/business-selectors'
import { CASHIER_NAME, STOCK_MOVEMENT_LABELS } from '@/lib/business-labels'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/business-store'
import type { Product, StockMovement } from '@/types/business'
import {
  StockAdjustDialog,
  type StockAdjustValues,
} from './stock-adjust-dialog'

const STOCK_FILTERS = [
  { value: 'all', label: 'Semua stok' },
  { value: 'low', label: 'Stok menipis' },
  { value: 'out', label: 'Stok habis' },
] as const

const MOVEMENT_FILTERS = [
  { value: 'all', label: 'Semua jenis' },
  { value: 'in', label: 'Stok masuk' },
  { value: 'out', label: 'Stok keluar' },
  { value: 'adjustment', label: 'Penyesuaian' },
  { value: 'sale', label: 'Penjualan' },
  { value: 'void', label: 'Pembatalan' },
] as const

export function InventoryPage() {
  const { products, categories, movements, adjustStock } = useBusinessStore()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const [historySearch, setHistorySearch] = useState('')
  const [historyProduct, setHistoryProduct] = useState('all')
  const [historyType, setHistoryType] = useState('all')

  const initialProduct = searchParams?.get('product') ?? undefined
  const [adjustProductId, setAdjustProductId] = useState<string | undefined>(
    initialProduct,
  )
  const [adjustOpen, setAdjustOpen] = useState(Boolean(initialProduct))

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Semua kategori' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  )

  const productOptions = useMemo(
    () => [
      { value: 'all', label: 'Semua produk' },
      ...products.map((product) => ({
        value: product.id,
        label: product.name,
      })),
    ],
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      const matchesCategory =
        categoryId === 'all' || product.categoryId === categoryId
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && isLowStock(product)) ||
        (stockFilter === 'out' && isOutOfStock(product))
      return matchesQuery && matchesCategory && matchesStock
    })
  }, [products, search, categoryId, stockFilter])

  const sortedMovements = useMemo(
    () =>
      [...movements].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [movements],
  )

  const lastMovementByProduct = useMemo(() => {
    const map = new Map<string, StockMovement>()
    for (const movement of sortedMovements) {
      if (!map.has(movement.productId)) map.set(movement.productId, movement)
    }
    return map
  }, [sortedMovements])

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    return sortedMovements.filter((movement) => {
      const matchesQuery =
        query.length === 0 ||
        movement.productName.toLowerCase().includes(query) ||
        movement.note.toLowerCase().includes(query)
      const matchesProduct =
        historyProduct === 'all' || movement.productId === historyProduct
      const matchesType =
        historyType === 'all' || movement.type === historyType
      return matchesQuery && matchesProduct && matchesType
    })
  }, [sortedMovements, historySearch, historyProduct, historyType])

  const productPagination = usePagination(filteredProducts.length, 10)
  const historyPagination = usePagination(filteredHistory.length, 10)

  const productRows = filteredProducts.slice(
    productPagination.start,
    productPagination.end,
  )
  const historyRows = filteredHistory.slice(
    historyPagination.start,
    historyPagination.end,
  )

  const activeProducts = products.filter((product) => product.status === 'active')
  const lowCount = products.filter(isLowStock).length
  const outCount = products.filter(isOutOfStock).length
  const stockValue = products.reduce(
    (total, product) => total + product.cost * product.stock,
    0,
  )

  const openAdjust = (productId?: string) => {
    setAdjustProductId(productId)
    setAdjustOpen(true)
  }

  const handleAdjust = (values: StockAdjustValues) => {
    const result = adjustStock({ ...values, staff: CASHIER_NAME })
    if (!result.ok) {
      toast.error('Penyesuaian gagal', { description: result.reason })
      return false
    }

    const product = products.find((item) => item.id === values.productId)
    toast.success('Stok diperbarui', {
      description: `${product?.name ?? 'Produk'} · ${STOCK_MOVEMENT_LABELS[values.mode]}`,
    })
    return true
  }

  const productColumns: DataTableColumn<Product>[] = [
    {
      key: 'product',
      header: 'Produk',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <ProductThumbnail src={product.imageUrl} alt={product.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {product.sku}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (product) => (
        <span className="text-muted-foreground">
          {getCategoryName(categories, product.categoryId)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      className: 'tabular-nums',
      cell: (product) => (
        <span className="font-medium">
          {formatNumber(product.stock)}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            {product.unit}
          </span>
        </span>
      ),
    },
    {
      key: 'min',
      header: 'Minimum',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden tabular-nums sm:table-cell',
      cell: (product) => formatNumber(product.minStock),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product) => (
        <StockBadge stock={product.stock} minStock={product.minStock} />
      ),
    },
    {
      key: 'last',
      header: 'Aktivitas terakhir',
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden text-xs text-muted-foreground lg:table-cell',
      cell: (product) => {
        const movement = lastMovementByProduct.get(product.id)
        return movement
          ? `${STOCK_MOVEMENT_LABELS[movement.type]} · ${formatDateTime(movement.createdAt)}`
          : 'Belum ada'
      },
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-28',
      className: 'text-right',
      cell: (product) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAdjust(product.id)}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          Sesuaikan
        </Button>
      ),
    },
  ]

  const historyColumns: DataTableColumn<StockMovement>[] = [
    {
      key: 'date',
      header: 'Waktu',
      className: 'whitespace-nowrap text-xs text-muted-foreground',
      cell: (movement) => formatDateTime(movement.createdAt),
    },
    {
      key: 'product',
      header: 'Produk',
      cell: (movement) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{movement.productName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {movement.note}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Jenis',
      cell: (movement) => (
        <StatusBadge
          status={movement.type}
          label={STOCK_MOVEMENT_LABELS[movement.type]}
        />
      ),
    },
    {
      key: 'change',
      header: 'Perubahan',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (movement) => (
        <span
          className={cn(
            'font-semibold',
            movement.quantity < 0 ? 'text-destructive' : 'text-success',
          )}
        >
          {movement.quantity > 0 ? '+' : ''}
          {formatNumber(movement.quantity)}
        </span>
      ),
    },
    {
      key: 'after',
      header: 'Stok akhir',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden text-right tabular-nums sm:table-cell',
      cell: (movement) => formatNumber(movement.stockAfter),
    },
    {
      key: 'staff',
      header: 'Petugas',
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden text-muted-foreground lg:table-cell',
      cell: (movement) => movement.staff,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Inventori"
        description="Pantau stok, catat pergerakan barang, dan tangani produk yang menipis."
        badge={<DemoDataBadge />}
        actions={
          <Button onClick={() => openAdjust()}>
            <SlidersHorizontalIcon aria-hidden="true" />
            Sesuaikan stok
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="SKU aktif"
          value={formatNumber(activeProducts.length)}
          hint={`${formatNumber(products.length)} total produk`}
          icon={PackageIcon}
        />
        <StatTile
          label="Stok menipis"
          value={formatNumber(lowCount)}
          hint="Menyentuh batas minimum"
          icon={AlertTriangleIcon}
          tone="warning"
        />
        <StatTile
          label="Stok habis"
          value={formatNumber(outCount)}
          hint="Perlu segera diisi"
          icon={BoxesIcon}
          tone="destructive"
        />
        <StatTile
          label="Nilai stok"
          value={formatCurrency(stockValue)}
          hint="Harga modal × stok"
          icon={WalletIcon}
          tone="success"
        />
      </section>

      {lowCount > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <AlertTriangleIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-warning"
            />
            <span>
              <span className="font-semibold">{formatNumber(lowCount)} produk</span>{' '}
              perlu restock.
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTab('stock')
              setStockFilter('low')
            }}
          >
            Lihat produk
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="stock">
            <BoxesIcon aria-hidden="true" />
            Stok
          </TabsTrigger>
          <TabsTrigger value="history">
            <ClipboardListIcon aria-hidden="true" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-3">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-4 lg:flex-row lg:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari produk atau SKU…"
                className="lg:max-w-xs"
              />
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <FilterSelect
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categoryOptions}
                  ariaLabel="Filter kategori"
                />
                <FilterSelect
                  value={stockFilter}
                  onChange={setStockFilter}
                  options={STOCK_FILTERS}
                  ariaLabel="Filter stok"
                />
              </div>
            </div>

            <DataTable
              columns={productColumns}
              rows={productRows}
              getRowKey={(product) => product.id}
              empty={
                <EmptyState
                  icon={BoxesIcon}
                  title="Tidak ada produk yang cocok"
                  description="Coba ubah pencarian atau filter stok."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setCategoryId('all')
                        setStockFilter('all')
                      }}
                    >
                      Reset filter
                    </Button>
                  }
                />
              }
            />

            <TablePagination
              page={productPagination.page}
              pageCount={productPagination.pageCount}
              total={filteredProducts.length}
              start={productPagination.start}
              end={productPagination.end}
              onPageChange={productPagination.setPage}
            />
          </section>
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-4 lg:flex-row lg:items-center">
              <SearchInput
                value={historySearch}
                onChange={setHistorySearch}
                placeholder="Cari produk atau catatan…"
                className="lg:max-w-xs"
              />
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <FilterSelect
                  value={historyProduct}
                  onChange={setHistoryProduct}
                  options={productOptions}
                  ariaLabel="Filter produk"
                />
                <FilterSelect
                  value={historyType}
                  onChange={setHistoryType}
                  options={MOVEMENT_FILTERS}
                  ariaLabel="Filter jenis pergerakan"
                />
              </div>
            </div>

            <DataTable
              columns={historyColumns}
              rows={historyRows}
              getRowKey={(movement) => movement.id}
              empty={
                <EmptyState
                  icon={ClipboardListIcon}
                  title="Belum ada pergerakan stok"
                  description="Penyesuaian stok dan penjualan akan muncul di sini."
                />
              }
            />

            <TablePagination
              page={historyPagination.page}
              pageCount={historyPagination.pageCount}
              total={filteredHistory.length}
              start={historyPagination.start}
              end={historyPagination.end}
              onPageChange={historyPagination.setPage}
            />
          </section>
        </TabsContent>
      </Tabs>

      <StockAdjustDialog
        open={adjustOpen}
        onOpenChange={(open) => {
          setAdjustOpen(open)
          if (!open) setAdjustProductId(undefined)
        }}
        products={products}
        preselectedProductId={adjustProductId}
        onSubmit={handleAdjust}
      />
    </div>
  )
}
