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
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatNumber } from '@/lib/format'
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
  className?: string
}

/**
 * Current order and totals for the POS terminal. Tender controls live in the
 * checkout dialog; this panel only reviews the order and opens payment.
 */
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
  className,
}: CartPanelProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const previousLineCount = useRef(0)
  const dineIn = orderType === 'dine-in'

  // Keep the most recently added line in view inside the scrollable body.
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
        'flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">Current Order</h2>
            <Badge
              variant="secondary"
              className="font-mono text-[11px] tabular-nums"
            >
              #{orderId}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Kosongkan keranjang"
            title="Kosongkan keranjang"
            disabled={empty}
            onClick={() => {
              onClear()
              toast('Keranjang dikosongkan')
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCustomerPicker}
            aria-label={`Pelanggan saat ini: ${customerName}. Ubah pelanggan`}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-left transition-colors hover:border-primary/40"
          >
            <UserIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {customerName}
            </span>
            <span className="text-[11px] font-semibold text-primary">Ubah</span>
          </button>

          <div
            role="group"
            aria-label="Tipe pesanan"
            className="inline-flex shrink-0 rounded-lg border border-border bg-muted p-0.5"
          >
            <button
              type="button"
              aria-pressed={dineIn}
              aria-label="Dine in"
              title="Dine in"
              onClick={() => onOrderTypeChange('dine-in')}
              className={cn(
                'flex size-7 items-center justify-center rounded-md transition-colors',
                dineIn
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <UtensilsIcon aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-pressed={!dineIn}
              aria-label="Takeaway"
              title="Takeaway"
              onClick={() => onOrderTypeChange('takeaway')}
              className={cn(
                'flex size-7 items-center justify-center rounded-md transition-colors',
                !dineIn
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ShoppingBagIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        {dineIn ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
            <ArmchairIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            <label
              htmlFor="pos-table-number"
              className="text-xs font-medium text-muted-foreground"
            >
              No. Bangku
            </label>
            <Input
              id="pos-table-number"
              inputMode="numeric"
              autoComplete="off"
              value={tableNumber}
              onChange={(event) =>
                onTableNumberChange(sanitizeTableNumber(event.target.value))
              }
              placeholder="—"
              aria-label="Nomor bangku"
              className="ml-auto h-7 w-14 border-border bg-background px-1 text-center text-sm font-semibold tabular-nums"
            />
          </div>
        ) : null}
      </div>

      {/* Scrollable body: order lines and totals. Keeping them in one scroll
          area stops the line list from collapsing to zero height on short
          laptop viewports. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        {/* Lines */}
        <div className="p-3">
          {empty ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
              <ShoppingCartIcon
                aria-hidden="true"
                className="size-7 text-muted-foreground"
              />
              <p className="text-sm font-medium">Keranjang masih kosong</p>
              <p className="text-xs text-muted-foreground">
                Pilih produk di katalog untuk mulai transaksi.
              </p>
            </div>
          ) : (
            <ul ref={listRef} className="flex flex-col gap-2">
              {lines.map((line) => {
                const lineTotal = line.product.price * line.quantity
                const atMaxStock =
                  line.product.stock !== undefined &&
                  line.quantity >= line.product.stock

                return (
                  <li
                    key={line.product.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5 transition-colors hover:border-primary/30"
                  >
                    {/* Name + line total get the full width of the panel */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm leading-tight font-semibold">
                        {line.product.name}
                      </p>
                      <span className="shrink-0 text-sm font-bold tabular-nums">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
                        <button
                          type="button"
                          aria-label={`Kurangi ${line.product.name}`}
                          onClick={() => onDecrement(line.product.id)}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-90"
                        >
                          <MinusIcon aria-hidden="true" className="size-4" />
                        </button>
                        <span className="min-w-7 text-center text-xs font-semibold tabular-nums">
                          {formatNumber(line.quantity)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tambah ${line.product.name}`}
                          disabled={atMaxStock}
                          onClick={() => onIncrement(line.product.id)}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-40"
                        >
                          <PlusIcon aria-hidden="true" className="size-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={`Hapus ${line.product.name}`}
                        onClick={() => onRemove(line.product.id)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2Icon aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Totals */}
        <div className="mt-auto flex flex-col gap-2 border-t border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Pajak ({formatNumber(taxRate * 100)}%)
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(totals.tax)}
            </span>
          </div>
          {memberEligible ? (
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                aria-pressed={member}
                onClick={onToggleMember}
                className={cn(
                  'inline-flex items-center gap-1 transition-colors',
                  member
                    ? 'text-success'
                    : 'text-muted-foreground line-through',
                )}
              >
                <TicketPercentIcon aria-hidden="true" className="size-3.5" />
                Diskon pelanggan (-{formatNumber(memberDiscountRate * 100)}%)
              </button>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  member ? 'text-success' : 'text-muted-foreground',
                )}
              >
                {member
                  ? `-${formatCurrency(totals.discount)}`
                  : formatCurrency(0)}
              </span>
            </div>
          ) : null}

          <Separator className="my-0.5" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Total Tagihan</span>
            <span className="text-xl font-bold text-primary tabular-nums">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
        <Button
          type="button"
          size="lg"
          onClick={onCheckout}
          disabled={empty}
          className="h-12 w-full justify-between rounded-xl px-4 text-[15px] font-bold"
        >
          <span className="flex items-center gap-2">
            <WalletIcon aria-hidden="true" className="size-5" />
            Bayar Sekarang
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(totals.total)}
          </span>
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Tekan F12 untuk membuka pembayaran
        </p>
      </div>
    </aside>
  )
}
