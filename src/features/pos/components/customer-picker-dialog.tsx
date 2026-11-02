"use client";

import { useMemo, useState } from 'react'
import { CheckIcon, SearchXIcon, UserRoundIcon, UsersIcon } from 'lucide-react'

import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { initials } from '@/features/customers/customer-detail-sheet'
import { getCustomerStats } from '@/lib/business-selectors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Customer, Transaction } from '@/types/business'

type CustomerPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  transactions: Transaction[]
  selectedId: string | null
  memberDiscountRate: number
  onSelect: (customerId: string | null) => void
}

/** Pick a registered customer for the current order, or fall back to walk-in. */
export function CustomerPickerDialog({
  open,
  onOpenChange,
  customers,
  transactions,
  selectedId,
  memberDiscountRate,
  onSelect,
}: CustomerPickerDialogProps) {
  const [search, setSearch] = useState('')

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

  const choose = (customerId: string | null) => {
    onSelect(customerId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="gap-1 border-b p-4 pr-12">
          <DialogTitle className="text-base font-bold">
            Pilih pelanggan
          </DialogTitle>
          <DialogDescription>
            Pelanggan terdaftar otomatis mendapat diskon{' '}
            {formatNumber(memberDiscountRate * 100)}%.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b p-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, telepon, atau email…"
          />
        </div>

        <div className="max-h-[46svh] overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => choose(null)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
              selectedId === null
                ? 'border-primary/40 bg-primary/5'
                : 'border-transparent hover:bg-muted',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRoundIcon aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                Walk-in Customer
              </span>
              <span className="block text-xs text-muted-foreground">
                Tanpa diskon pelanggan
              </span>
            </span>
            {selectedId === null ? (
              <CheckIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            ) : null}
          </button>

          {filtered.map((customer) => {
            const stats = getCustomerStats(transactions, customer.id)
            const selected = customer.id === selectedId

            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => choose(customer.id)}
                className={cn(
                  'mt-1 flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                  selected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-transparent hover:bg-muted',
                )}
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="text-[11px] font-semibold">
                    {initials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {customer.name}
                    </span>
                    {stats.completedCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1.5 text-[10px]"
                      >
                        {formatNumber(stats.completedCount)}×
                      </Badge>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {customer.phone}
                    {stats.totalSpent > 0
                      ? ` · ${formatCurrency(stats.totalSpent)}`
                      : ''}
                  </span>
                </span>
                {selected ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                ) : null}
              </button>
            )
          })}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <SearchXIcon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <p className="text-sm font-medium">Pelanggan tidak ditemukan</p>
              <p className="text-xs text-muted-foreground">
                Tambahkan pelanggan baru di menu Customers.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
          <UsersIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {formatNumber(customers.length)} pelanggan terdaftar di toko ini.
        </div>
      </DialogContent>
    </Dialog>
  )
}
