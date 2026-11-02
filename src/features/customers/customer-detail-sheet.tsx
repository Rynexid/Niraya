"use client";

import { CalendarIcon, MailIcon, PencilIcon, PhoneIcon, StickyNoteIcon } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getCustomerStats } from '@/lib/business-selectors'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/format'
import type { Customer, Transaction } from '@/types/business'

export function CustomerDetailSheet({
  customer,
  transactions,
  open,
  onOpenChange,
  onEdit,
}: {
  customer: Customer | null
  transactions: readonly Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (customer: Customer) => void
}) {
  const stats = customer
    ? getCustomerStats(transactions, customer.id)
    : { transactionCount: 0, completedCount: 0, totalSpent: 0, lastVisit: undefined }

  const history = customer
    ? transactions
        .filter((transaction) => transaction.customerId === customer.id)
        .slice(0, 6)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {customer ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3 pr-8">
                <Avatar className="size-12">
                  <AvatarFallback className="text-sm font-semibold">
                    {initials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{customer.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    Bergabung {formatDate(customer.joinedAt)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums">
                    {formatNumber(stats.transactionCount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Transaksi</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="truncate text-lg font-semibold tabular-nums">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Total belanja</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="truncate text-sm font-semibold">
                    {stats.lastVisit ? formatDate(stats.lastVisit) : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Terakhir</p>
                </div>
              </div>

              <dl className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
                <DetailRow icon={PhoneIcon} label="Telepon">
                  {customer.phone}
                </DetailRow>
                <DetailRow icon={MailIcon} label="Email">
                  {customer.email ?? '—'}
                </DetailRow>
                <DetailRow icon={CalendarIcon} label="Bergabung">
                  {formatDate(customer.joinedAt)}
                </DetailRow>
                <DetailRow icon={StickyNoteIcon} label="Catatan">
                  {customer.notes ?? '—'}
                </DetailRow>
              </dl>

              <h3 className="mt-5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Riwayat transaksi
              </h3>
              {history.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Belum ada transaksi untuk pelanggan ini.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
                  {history.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium">
                          {transaction.number}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={transaction.status} />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(transaction.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <SheetFooter className="border-t">
              <Button onClick={() => onEdit(customer)}>
                <PencilIcon aria-hidden="true" />
                Edit pelanggan
              </Button>
            </SheetFooter>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Pelanggan tidak ditemukan</SheetTitle>
            <SheetDescription>
              Pilih pelanggan dari daftar untuk melihat detailnya.
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof PhoneIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right text-sm font-medium">
        {children}
      </dd>
    </div>
  )
}
