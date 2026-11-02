import { useMemo, useState } from 'react'
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Grid3X3Icon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DemoDataBadge } from '@/components/shared/demo-data-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusBadge } from '@/components/shared/status-badge'
import { TablePagination } from '@/components/shared/table-pagination'
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
import { getProductCount } from '@/lib/business-selectors'
import { formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { Category } from '@/types/business'
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from './category-form-dialog'

export function CategoriesPage() {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useBusinessStore()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return categories
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.description ?? '').toLowerCase().includes(query),
    )
  }, [categories, search])

  const pagination = usePagination(filtered.length, 10)
  const rows = filtered.slice(pagination.start, pagination.end)

  const activeCount = categories.filter(
    (category) => category.status === 'active',
  ).length
  const assignedCount = products.filter((product) =>
    categories.some((category) => category.id === product.categoryId),
  ).length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormOpen(true)
  }

  const handleSubmit = (values: CategoryFormValues) => {
    const duplicate = categories.some(
      (category) =>
        category.id !== editing?.id &&
        category.name.toLowerCase() === values.name.trim().toLowerCase(),
    )
    if (duplicate) {
      toast.error('Nama kategori sudah dipakai')
      return false
    }

    if (editing) {
      updateCategory(editing.id, values)
      toast.success('Kategori diperbarui', { description: values.name })
    } else {
      addCategory(values)
      toast.success('Kategori ditambahkan', { description: values.name })
    }
    return true
  }

  const handleToggleStatus = (category: Category) => {
    const next = category.status === 'active' ? 'archived' : 'active'
    updateCategory(category.id, {
      name: category.name,
      description: category.description,
      status: next,
    })
    toast.success(
      next === 'active' ? 'Kategori diaktifkan' : 'Kategori diarsipkan',
      { description: category.name },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const result = deleteCategory(deleteTarget.id)
    if (result.ok) {
      toast.success('Kategori dihapus', { description: deleteTarget.name })
      setDeleteTarget(null)
    } else {
      toast.error('Tidak bisa menghapus kategori', {
        description: result.reason,
      })
    }
  }

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'name',
      header: 'Kategori',
      cell: (category) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{category.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {category.description ?? 'Tanpa deskripsi'}
          </p>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Produk',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (category) => formatNumber(getProductCount(products, category.id)),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (category) => <StatusBadge status={category.status} />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-10',
      className: 'text-right',
      cell: (category) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Aksi untuk ${category.name}`}
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi kategori</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => openEdit(category)}>
              <PencilIcon aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleToggleStatus(category)}>
              {category.status === 'active' ? (
                <ArchiveIcon aria-hidden="true" />
              ) : (
                <ArchiveRestoreIcon aria-hidden="true" />
              )}
              {category.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteTarget(category)}
            >
              <Trash2Icon aria-hidden="true" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Kategori"
        description="Atur kelompok produk supaya katalog dan laporan lebih rapi."
        badge={<DemoDataBadge />}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            Tambah kategori
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Total kategori"
          value={formatNumber(categories.length)}
          hint={`${formatNumber(activeCount)} aktif`}
          icon={Grid3X3Icon}
        />
        <StatTile
          label="Produk terkelompok"
          value={formatNumber(assignedCount)}
          hint={`${formatNumber(products.length)} produk di katalog`}
          icon={PackageIcon}
          tone="success"
        />
        <StatTile
          label="Kategori diarsipkan"
          value={formatNumber(categories.length - activeCount)}
          hint="Tidak tampil di POS"
          icon={ArchiveIcon}
          tone="warning"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari kategori…"
            className="sm:max-w-xs"
          />
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {formatNumber(filtered.length)} kategori
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(category) => category.id}
          empty={
            categories.length === 0 ? (
              <EmptyState
                icon={Grid3X3Icon}
                title="Belum ada kategori"
                description="Buat kategori pertama untuk mengelompokkan produk."
                action={
                  <Button onClick={openCreate}>
                    <PlusIcon aria-hidden="true" />
                    Tambah kategori
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Grid3X3Icon}
                title="Kategori tidak ditemukan"
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

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus kategori?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus. Kategori yang masih dipakai produk tidak bisa dihapus.`
            : ''
        }
        confirmLabel="Hapus kategori"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
