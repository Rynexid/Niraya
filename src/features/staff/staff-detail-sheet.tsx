"use client";

import { MailIcon, PencilIcon, ShieldCheckIcon, ClockIcon } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ROLE_LABELS } from '@/lib/business-labels'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { initials } from '@/features/customers/customer-detail-sheet'
import type { Staff, Transaction } from '@/types/business'

export function StaffDetailSheet({
  member,
  transactions,
  open,
  onOpenChange,
  onEdit,
}: {
  member: Staff | null
  transactions: readonly Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (member: Staff) => void
}) {
  const handled = member
    ? transactions
        .filter((transaction) => transaction.cashier === member.name)
        .slice(0, 6)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {member ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3 pr-8">
                <Avatar className="size-12">
                  <AvatarFallback className="text-sm font-semibold">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{member.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {member.email}
                  </SheetDescription>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
                    <StatusBadge status={member.status} />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MailIcon aria-hidden="true" className="size-3.5" />
                    Email
                  </dt>
                  <dd className="truncate text-sm font-medium">{member.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
                    Peran
                  </dt>
                  <dd className="text-sm font-medium">{ROLE_LABELS[member.role]}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon aria-hidden="true" className="size-3.5" />
                    Bergabung
                  </dt>
                  <dd className="text-sm font-medium">{formatDate(member.joinedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon aria-hidden="true" className="size-3.5" />
                    Terakhir aktif
                  </dt>
                  <dd className="text-sm font-medium">
                    {member.lastActive ? formatDateTime(member.lastActive) : '—'}
                  </dd>
                </div>
              </dl>

              <h3 className="mt-5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Transaksi ditangani
              </h3>
              {handled.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Belum ada transaksi yang tercatat untuk staf ini.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
                  {handled.map((transaction) => (
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
              <Button onClick={() => onEdit(member)}>
                <PencilIcon aria-hidden="true" />
                Edit staf
              </Button>
            </SheetFooter>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Staf tidak ditemukan</SheetTitle>
            <SheetDescription>
              Pilih anggota tim dari daftar untuk melihat detailnya.
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}
