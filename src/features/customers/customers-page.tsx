import { useMemo, useState } from 'react'
import {
  CalendarPlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundCheckIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DemoDataBadge } from '@/components/shared/demo-data-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { TablePagination } from '@/components/shared/table-pagination'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePagination } from '@/hooks/use-pagination'
import { getCustomerStats } from '@/lib/business-selectors'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { Customer } from '@/types/business'
import {
  CustomerDetailSheet,
  initials,
} from './customer-detail-sheet'
import {
  CustomerFormDialog,
  type CustomerFormValues,
} from './customer-form-dialog'

export function CustomersPage() {
  const {
    customers,
    transactions,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useBusinessStore()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        (customer.email ?? '').toLowerCase().includes(query),
    )
  }, [customers, search])

  const pagination = usePagination(filtered.length, 10)
  const rows = filtered.slice(pagination.start, pagination.end)

  const detailCustomer =
    customers.find((customer) => customer.id === detailId) ?? null

  const totalSpend = transactions
    .filter(
      (transaction) =>
        transaction.status === 'completed' && transaction.customerId,
    )
    .reduce((total, transaction) => total + transaction.total, 0)

  const buyers = customers.filter(
    (customer) =>
      getCustomerStats(transactions, customer.id).completedCount > 0,
  )
  const averageSpend = buyers.length === 0 ? 0 : Math.round(totalSpend / buyers.length)

  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newCustomers = customers.filter(
    (customer) => new Date(customer.joinedAt).getTime() >= monthAgo,
  ).length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setDetailId(null)
    setEditing(customer)
    setFormOpen(true)
  }

  const handleSubmit = (values: CustomerFormValues) => {
    const duplicate = customers.some(
      (customer) =>
        customer.id !== editing?.id && customer.phone === values.phone.trim(),
    )
    if (duplicate) {
      toast.error('Nomor telepon sudah terdaftar')
      return false
    }

    if (editing) {
      updateCustomer(editing.id, values)
      toast.success('Pelanggan diperbarui', { description: values.name })
    } else {
      addCustomer(values)
      toast.success('Pelanggan ditambahkan', { description: values.name })
    }
    return true
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    toast.success('Pelanggan dihapus', { description: deleteTarget.name })
    setDeleteTarget(null)
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'customer',
      header: 'Pelanggan',
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-[11px] font-semibold">
              {initials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {customer.email ?? customer.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden text-muted-foreground md:table-cell',
      cell: (customer) => customer.phone,
    },
    {
      key: 'transactions',
      header: 'Transaksi',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (customer) =>
        formatNumber(getCustomerStats(transactions, customer.id).transactionCount),
    },
    {
      key: 'spent',
      header: 'Total belanja',
      className: 'text-right font-medium tabular-nums',
      headerClassName: 'text-right',
      cell: (customer) =>
        formatCurrency(getCustomerStats(transactions, customer.id).totalSpent),
    },
    {
      key: 'last',
      header: 'Terakhir',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden text-xs text-muted-foreground sm:table-cell',
      cell: (customer) => {
        const stats = getCustomerStats(transactions, customer.id)
        return stats.lastVisit ? formatDate(stats.lastVisit) : 'Belum pernah'
      },
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-10',
      className: 'text-right',
      cell: (customer) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Aksi untuk ${customer.name}`}
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi pelanggan</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setDetailId(customer.id)}>
                <UserRoundIcon aria-hidden="true" />
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEdit(customer)}>
                <PencilIcon aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(customer)}
              >
                <Trash2Icon aria-hidden="true" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pelanggan"
        description="Simpan data pelanggan dan lihat riwayat belanja mereka."
        badge={<DemoDataBadge />}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            Tambah pelanggan
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total pelanggan"
          value={formatNumber(customers.length)}
          hint={`${formatNumber(buyers.length)} pernah bertransaksi`}
          icon={UsersIcon}
        />
        <StatTile
          label="Total belanja"
          value={formatCurrency(totalSpend)}
          hint="Dari transaksi selesai"
          icon={WalletIcon}
          tone="success"
        />
        <StatTile
          label="Rata-rata belanja"
          value={formatCurrency(averageSpend)}
          hint="Per pelanggan aktif"
          icon={UserRoundCheckIcon}
          tone="info"
        />
        <StatTile
          label="Pelanggan baru"
          value={formatNumber(newCustomers)}
          hint="30 hari terakhir"
          icon={CalendarPlusIcon}
          tone="warning"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, telepon, atau email…"
            className="sm:max-w-sm"
          />
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {formatNumber(filtered.length)} pelanggan
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(customer) => customer.id}
          onRowClick={(customer) => setDetailId(customer.id)}
          empty={
            customers.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="Belum ada pelanggan"
                description="Tambahkan pelanggan agar transaksi bisa dikaitkan ke riwayat belanja."
                action={
                  <Button onClick={openCreate}>
                    <PlusIcon aria-hidden="true" />
                    Tambah pelanggan
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={UsersIcon}
                title="Pelanggan tidak ditemukan"
                description="Coba kata kunci lain."
                action={
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Reset pencarian
                  </Button>
                }
              />
            )
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

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSubmit={handleSubmit}
      />

      <CustomerDetailSheet
        customer={detailCustomer}
        transactions={transactions}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus pelanggan?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus dari daftar. Riwayat transaksi tetap tersimpan dengan nama pelanggan.`
            : ''
        }
        confirmLabel="Hapus pelanggan"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
