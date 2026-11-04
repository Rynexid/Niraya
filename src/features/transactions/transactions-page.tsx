"use client";

import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import {
  BanIcon,
  EyeIcon,
  ReceiptTextIcon,
  SearchXIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterSelect } from '@/components/shared/filter-select'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusBadge } from '@/components/shared/status-badge'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/use-pagination'
import { PAYMENT_METHOD_LABELS } from '@/lib/business-labels'
import { summarizeTransactions } from '@/lib/business-selectors'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { Transaction } from '@/types/business'
import { TransactionDetailSheet } from './transaction-detail-sheet'
import { VoidTransactionDialog } from './void-transaction-dialog'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'completed', label: 'Selesai' },
  { value: 'voided', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Refund' },
] as const

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Semua pembayaran' },
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'card', label: 'EDC' },
] as const

const today = new Date()
const DEFAULT_FROM = format(subDays(today, 30), 'yyyy-MM-dd')
const DEFAULT_TO = format(today, 'yyyy-MM-dd')

export function TransactionsPage() {
  const { transactions, voidTransaction } = useBusinessStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null)

  const dateFiltered = useMemo(() => {
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : Infinity

    return transactions.filter((transaction) => {
      const time = new Date(transaction.createdAt).getTime()
      return time >= fromTime && time <= toTime
    })
  }, [transactions, from, to])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return dateFiltered.filter((transaction) => {
      const matchesQuery =
        query.length === 0 ||
        transaction.number.toLowerCase().includes(query) ||
        transaction.customerName.toLowerCase().includes(query) ||
        transaction.cashier.toLowerCase().includes(query)
      const matchesStatus = status === 'all' || transaction.status === status
      const matchesPayment =
        payment === 'all' || transaction.paymentMethod === payment
      return matchesQuery && matchesStatus && matchesPayment
    })
  }, [dateFiltered, search, status, payment])

  const pagination = usePagination(filtered.length, 10)
  const rows = filtered.slice(pagination.start, pagination.end)

  const summary = summarizeTransactions(dateFiltered)
  const voidedCount = dateFiltered.filter(
    (transaction) => transaction.status === 'voided',
  ).length

  const detailTransaction =
    transactions.find((transaction) => transaction.id === detailId) ?? null

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setPayment('all')
    setFrom(DEFAULT_FROM)
    setTo(DEFAULT_TO)
  }

  const handleVoid = (reason: string) => {
    if (!voidTarget) return false
    const result = voidTransaction(voidTarget.id, reason)
    if (!result.ok) {
      toast.error('Pembatalan gagal', { description: result.reason })
      return false
    }
    toast.success('Transaksi dibatalkan', {
      description: `${voidTarget.number} · stok dikembalikan`,
    })
    setVoidTarget(null)
    return true
  }

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'number',
      header: 'Transaksi',
      cell: (transaction) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium">{transaction.number}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatNumber(
              transaction.items.reduce((total, item) => total + item.quantity, 0),
            )}{' '}
            item
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Waktu',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell',
      cell: (transaction) => formatDateTime(transaction.createdAt),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      cell: (transaction) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{transaction.customerName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {transaction.cashier}
          </p>
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Pembayaran',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell',
      cell: (transaction) => (
        <StatusBadge
          status={transaction.paymentMethod}
          label={PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
        />
      ),
    },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right font-medium tabular-nums',
      headerClassName: 'text-right',
      cell: (transaction) => formatCurrency(transaction.total),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (transaction) => <StatusBadge status={transaction.status} />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-10',
      className: 'text-right',
      cell: (transaction) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Lihat ${transaction.number}`}
          onClick={(event) => {
            event.stopPropagation()
            setDetailId(transaction.id)
          }}
        >
          <EyeIcon aria-hidden="true" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Transaksi"
        description="Telusuri riwayat penjualan, cetak ulang struk, dan tangani pembatalan."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pendapatan"
          value={formatCurrency(summary.revenue)}
          hint="Transaksi selesai pada periode ini"
          icon={TrendingUpIcon}
          tone="success"
        />
        <StatTile
          label="Transaksi selesai"
          value={formatNumber(summary.count)}
          hint={`${formatNumber(summary.itemsSold)} item terjual`}
          icon={ReceiptTextIcon}
        />
        <StatTile
          label="Rata-rata transaksi"
          value={formatCurrency(summary.average)}
          hint="Nilai keranjang rata-rata"
          icon={WalletIcon}
          tone="info"
        />
        <StatTile
          label="Dibatalkan"
          value={formatNumber(voidedCount)}
          hint="Stok dikembalikan"
          icon={BanIcon}
          tone="destructive"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nomor, pelanggan, kasir…"
            className="lg:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <DateRangeFilter
              from={from}
              to={to}
              onFromChange={setFrom}
              onToChange={setTo}
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filter status"
            />
            <FilterSelect
              value={payment}
              onChange={setPayment}
              options={PAYMENT_OPTIONS}
              ariaLabel="Filter pembayaran"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(transaction) => transaction.id}
          onRowClick={(transaction) => setDetailId(transaction.id)}
          empty={
            <EmptyState
              icon={SearchXIcon}
              title="Tidak ada transaksi"
              description="Belum ada transaksi yang cocok dengan filter ini. Coba ubah rentang tanggal atau reset filter."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Reset filter
                </Button>
              }
            />
          }
        />

        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={filtered.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={pagination.setPage}
        />
      </section>

      <TransactionDetailSheet
        transaction={detailTransaction}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onVoid={(transaction) => setVoidTarget(transaction)}
      />

      <VoidTransactionDialog
        open={voidTarget !== null}
        onOpenChange={(open) => {
          if (!open) setVoidTarget(null)
        }}
        transaction={voidTarget}
        onSubmit={handleVoid}
      />
    </div>
  )
}
