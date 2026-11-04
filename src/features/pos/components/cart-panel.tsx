"use client";

import { useEffect, useRef } from 'react'
import {
  ArmchairIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TicketPercentIcon,
  Trash2Icon,
  UserIcon,
  UtensilsIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PosCartLine } from '../hooks/use-pos-cart'
import { sanitizeTableNumber, type PosOrderType } from '../lib/order'
import type { PosTotals } from '../lib/pricing'

type CartPanelProps = {
  orderId: string
  lines: PosCartLine[]
  itemCount: number
  totals: PosTotals
  member: boolean
  memberEligible: boolean
  memberDiscountRate: number
  taxRate: number
  onToggleMember: () => void
  customerName: string
  onOpenCustomerPicker: () => void
  orderType: PosOrderType
  onOrderTypeChange: (orderType: PosOrderType) => void
  tableNumber: string
  onTableNumberChange: (tableNumber: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onCheckout: () => void
  onClose?: () => void
  className?: string
}

export function CartPanel({
  orderId,
  lines,
  itemCount,
  totals,
  member,
  memberEligible,
  memberDiscountRate,
  taxRate,
  onToggleMember,
  customerName,
  onOpenCustomerPicker,
  orderType,
  onOrderTypeChange,
  tableNumber,
  onTableNumberChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
  onClose,
  className,
}: CartPanelProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const previousLineCount = useRef(lines.length)
  const dineIn = orderType === 'dine-in'

  useEffect(() => {
    if (lines.length > previousLineCount.current) {
      listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
    }
    previousLineCount.current = lines.length
  }, [lines.length])

  const empty = itemCount === 0

  return (
    <aside
      aria-label="Pesanan saat ini"
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-card',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingCartIcon className="size-4 shrink-0" />
          <h2 className="truncate text-sm font-semibold">Pesanan Saat Ini</h2>
          <Badge
            variant="outline"
            className="shrink-0 px-1.5 py-0 font-mono text-[10px] tabular-nums"
          >
            #{orderId}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Kosongkan keranjang"
            title="Kosongkan keranjang"
            disabled={empty}
            onClick={() => {
              if (empty) return
              onClear()
              toast.success('Keranjang dikosongkan')
            }}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Tutup keranjang"
              title="Tutup keranjang"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b p-2">
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={dineIn ? 'default' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => onOrderTypeChange('dine-in')}
          >
            <UtensilsIcon className="size-3.5" />
            Dine in
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!dineIn ? 'default' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => onOrderTypeChange('takeaway')}
          >
            <ShoppingBagIcon className="size-3.5" />
            Takeaway
          </Button>
        </div>

        {dineIn ? (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
            <label
              htmlFor="cart-table-number"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <ArmchairIcon className="size-3.5 text-primary" />
              Nomor bangku
            </label>
            <Input
              id="cart-table-number"
              inputMode="numeric"
              autoComplete="off"
              value={tableNumber}
              onChange={(event) =>
                onTableNumberChange(sanitizeTableNumber(event.target.value))
              }
              placeholder="—"
              aria-label="Nomor bangku"
              className="h-7 w-14 border-border bg-background px-1 text-center text-sm font-semibold tabular-nums"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
            <UserIcon className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{customerName}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-[11px]"
            onClick={onOpenCustomerPicker}
          >
            {memberEligible ? 'Ubah' : 'Pilih'}
          </Button>
        </div>

        {memberEligible ? (
          <Button
            type="button"
            variant={member ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 w-full justify-start gap-1.5 text-xs"
            onClick={onToggleMember}
          >
            <TicketPercentIcon className="size-3.5" />
            {member
              ? `Diskon member ${Math.round(memberDiscountRate * 100)}% aktif`
              : `Terapkan diskon member ${Math.round(memberDiscountRate * 100)}%`}
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <ShoppingBagIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Keranjang Kosong</p>
            <p className="text-xs text-muted-foreground">
              Pilih produk untuk mulai
            </p>
          </div>
        ) : (
          <ul ref={listRef} className="space-y-1">
            {lines.map((line) => (
              <li
                key={line.product.id}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-6"
                    aria-label={`Kurangi ${line.product.name}`}
                    onClick={() => onDecrement(line.product.id)}
                  >
                    <MinusIcon className="size-3" />
                  </Button>
                  <span className="w-6 text-center text-xs tabular-nums">
                    {line.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-6"
                    aria-label={`Tambah ${line.product.name}`}
                    onClick={() => onIncrement(line.product.id)}
                  >
                    <PlusIcon className="size-3" />
                  </Button>
                </div>
                <p className="w-16 text-right text-xs font-semibold tabular-nums">
                  {formatCurrency(line.product.price * line.quantity)}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  aria-label={`Hapus ${line.product.name}`}
                  onClick={() => onRemove(line.product.id)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-1 border-t p-2">
        <div className="flex justify-between text-xs">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Diskon</span>
          <span className="tabular-nums">-{formatCurrency(totals.discount)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Pajak ({Math.round(taxRate * 100)}%)</span>
          <span className="tabular-nums">{formatCurrency(totals.tax)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(totals.total)}</span>
        </div>
        <Button
          className="h-9 w-full"
          disabled={empty}
          onClick={onCheckout}
        >
          Bayar
        </Button>
      </div>
    </aside>
  )
}
