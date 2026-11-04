"use client";

import { useMemo, useState } from 'react'
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusBadge } from '@/components/shared/status-badge'
import { TablePagination } from '@/components/shared/table-pagination'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/features/customers/customer-detail-sheet'
import { usePagination } from '@/hooks/use-pagination'
import { ROLE_LABELS } from '@/lib/business-labels'
import { formatDate, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { Staff } from '@/types/business'
import { StaffDetailSheet } from './staff-detail-sheet'
import { StaffFormDialog, type StaffFormValues } from './staff-form-dialog'

const ROLE_BADGE_VARIANT: Record<
  Staff['role'],
  'default' | 'info' | 'warning' | 'secondary'
> = {
  owner: 'default',
  admin: 'info',
  manager: 'warning',
  cashier: 'secondary',
}

const PERMISSION_ROWS = [
  { module: 'Dashboard', owner: true, admin: true, manager: true, cashier: true },
  { module: 'POS', owner: true, admin: true, manager: true, cashier: true },
  { module: 'Transaksi', owner: true, admin: true, manager: true, cashier: false },
  { module: 'Produk & kategori', owner: true, admin: true, manager: false, cashier: false },
  { module: 'Inventori', owner: true, admin: true, manager: true, cashier: false },
  { module: 'Pelanggan', owner: true, admin: true, manager: true, cashier: false },
  { module: 'Laporan', owner: true, admin: true, manager: true, cashier: false },
  { module: 'Staf & pengaturan', owner: true, admin: true, manager: false, cashier: false },
] as const

export function StaffPage() {
  const { staff, transactions, addStaff, updateStaff, deleteStaff } =
    useBusinessStore()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return staff
    return staff.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query),
    )
  }, [staff, search])

  const pagination = usePagination(filtered.length, 10)
  const rows = filtered.slice(pagination.start, pagination.end)

  const detailMember = staff.find((member) => member.id === detailId) ?? null

  const activeCount = staff.filter((member) => member.status === 'active').length
  const cashierCount = staff.filter(
    (member) => member.role === 'cashier' && member.status === 'active',
  ).length
  const adminCount = staff.filter(
    (member) =>
      (member.role === 'owner' || member.role === 'admin') &&
      member.status === 'active',
  ).length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (member: Staff) => {
    setDetailId(null)
    setEditing(member)
    setFormOpen(true)
  }

  const handleSubmit = (values: StaffFormValues) => {
    const duplicate = staff.some(
      (member) =>
        member.id !== editing?.id &&
        member.email.toLowerCase() === values.email.trim().toLowerCase(),
    )
    if (duplicate) {
      toast.error('Email sudah dipakai staf lain')
      return false
    }

    if (editing) {
      updateStaff(editing.id, values)
      toast.success('Data staf diperbarui', { description: values.name })
    } else {
      addStaff(values)
      toast.success('Staf ditambahkan', { description: values.name })
    }
    return true
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const result = deleteStaff(deleteTarget.id)
    if (result.ok) {
      toast.success('Staf dihapus', { description: deleteTarget.name })
      setDeleteTarget(null)
    } else {
      toast.error('Tidak bisa menghapus staf', {
        description: result.reason,
      })
    }
  }

  const columns: DataTableColumn<Staff>[] = [
    {
      key: 'staff',
      header: 'Staf',
      cell: (member) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-[11px] font-semibold">
              {initials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Peran',
      cell: (member) => (
        <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
          {ROLE_LABELS[member.role]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (member) => <StatusBadge status={member.status} />,
    },
    {
      key: 'joined',
      header: 'Bergabung',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden text-xs text-muted-foreground md:table-cell',
      cell: (member) => formatDate(member.joinedAt),
    },
    {
      key: 'last',
      header: 'Terakhir aktif',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden text-xs text-muted-foreground sm:table-cell',
      cell: (member) =>
        member.lastActive ? formatDate(member.lastActive) : 'Belum pernah',
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-10',
      className: 'text-right',
      cell: (member) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Aksi untuk ${member.name}`}
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi staf</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setDetailId(member.id)}>
                <UserRoundIcon aria-hidden="true" />
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEdit(member)}>
                <PencilIcon aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(member)}
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
        title="Staf"
        description="Kelola anggota tim, peran, dan status akses mereka."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            Tambah staf
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total staf"
          value={formatNumber(staff.length)}
          hint={`${formatNumber(activeCount)} aktif`}
          icon={UsersIcon}
        />
        <StatTile
          label="Kasir aktif"
          value={formatNumber(cashierCount)}
          hint="Siap melayani POS"
          icon={UserCheckIcon}
          tone="success"
        />
        <StatTile
          label="Admin & owner"
          value={formatNumber(adminCount)}
          hint="Akses penuh"
          icon={ShieldCheckIcon}
          tone="info"
        />
        <StatTile
          label="Nonaktif"
          value={formatNumber(staff.length - activeCount)}
          hint="Tidak bisa masuk"
          icon={UserRoundIcon}
          tone="warning"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau email…"
            className="sm:max-w-sm"
          />
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {formatNumber(filtered.length)} staf
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(member) => member.id}
          onRowClick={(member) => setDetailId(member.id)}
          empty={
            staff.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="Belum ada staf"
                description="Tambahkan anggota tim agar operasional bisa dibagi."
                action={
                  <Button onClick={openCreate}>
                    <PlusIcon aria-hidden="true" />
                    Tambah staf
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={UsersIcon}
                title="Staf tidak ditemukan"
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

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">Peran & izin</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Matriks ini menjadi acuan pembatasan modul. Penegakan otomatis aktif
            setelah autentikasi backend terpasang.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Modul</th>
                <th className="px-3 py-2 text-center font-medium">Owner</th>
                <th className="px-3 py-2 text-center font-medium">Admin</th>
                <th className="px-3 py-2 text-center font-medium">Manager</th>
                <th className="px-3 py-2 text-center font-medium">Kasir</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map((row) => (
                <tr key={row.module} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{row.module}</td>
                  {(['owner', 'admin', 'manager', 'cashier'] as const).map(
                    (role) => (
                      <td key={role} className="px-3 py-2 text-center">
                        {row[role] ? (
                          <span
                            className="text-success"
                            aria-label={`${role} diizinkan`}
                          >
                            ●
                          </span>
                        ) : (
                          <span
                            className="text-muted-foreground/40"
                            aria-label={`${role} tidak diizinkan`}
                          >
                            —
                          </span>
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editing}
        onSubmit={handleSubmit}
      />

      <StaffDetailSheet
        member={detailMember}
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
        title="Hapus staf?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus dari daftar staf. Akun owner tidak bisa dihapus.`
            : ''
        }
        confirmLabel="Hapus staf"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
