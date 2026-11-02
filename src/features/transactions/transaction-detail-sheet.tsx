import {
  ArmchairIcon,
  BanIcon,
  CreditCardIcon,
  PrinterIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UserIcon,
  UtensilsIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/business-labels'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import { printReceipt } from '@/features/pos/lib/print'
import type { Transaction } from '@/types/business'

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  onVoid,
}: {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVoid: (transaction: Transaction) => void
}) {
  const settings = useBusinessStore((state) => state.settings)

  const handlePrint = () => {
    if (!transaction) return

    const details = [
      { label: 'Tipe', value: ORDER_TYPE_LABELS[transaction.orderType] },
    ]
    if (transaction.orderType === 'dine-in' && transaction.tableNumber) {
      details.push({ label: 'Bangku', value: transaction.tableNumber })
    }

    const ok = printReceipt({
      orderId: transaction.number,
      date: new Date(transaction.createdAt),
      lines: transaction.items.map((item) => ({
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totals: {
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        total: transaction.total,
      },
      paymentMethod: PAYMENT_METHOD_LABELS[transaction.paymentMethod],
      cashReceived: transaction.cashReceived,
      change: transaction.change,
      cashier: transaction.cashier,
      storeName: settings.businessName,
      logoUrl: '/Logo.png',
      details,
    })

    if (!ok) {
      toast.error('Popup diblokir', {
        description: 'Izinkan popup untuk mencetak struk.',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {transaction ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <ReceiptTextIcon
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <SheetTitle className="font-mono">
                    {transaction.number}
                  </SheetTitle>
                </div>
                <StatusBadge status={transaction.status} />
              </div>
              <SheetDescription>
                {formatDateTime(transaction.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <InfoCell icon={UserIcon} label="Pelanggan">
                  {transaction.customerName}
                </InfoCell>
                <InfoCell icon={CreditCardIcon} label="Pembayaran">
                  {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                </InfoCell>
                <InfoCell
                  icon={
                    transaction.orderType === 'dine-in'
                      ? UtensilsIcon
                      : ShoppingBagIcon
                  }
                  label="Tipe pesanan"
                >
                  {ORDER_TYPE_LABELS[transaction.orderType]}
                </InfoCell>
                <InfoCell icon={ArmchairIcon} label="Bangku">
                  {transaction.tableNumber ?? '—'}
                </InfoCell>
              </dl>

              <h3 className="mt-5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Item pesanan
              </h3>
              <ul className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
                {transaction.items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-start justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatNumber(item.quantity)} ×{' '}
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 flex flex-col gap-1.5 text-sm">
                <TotalRow label="Subtotal" value={formatCurrency(transaction.subtotal)} />
                {transaction.discount > 0 ? (
                  <TotalRow
                    label="Diskon"
                    value={`-${formatCurrency(transaction.discount)}`}
                    tone="success"
                  />
                ) : null}
                <TotalRow label="Pajak" value={formatCurrency(transaction.tax)} />
                <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-2">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-base font-bold tabular-nums">
                    {formatCurrency(transaction.total)}
                  </dd>
                </div>
                {transaction.paymentMethod === 'cash' ? (
                  <>
                    <TotalRow
                      label="Tunai diterima"
                      value={formatCurrency(transaction.cashReceived ?? 0)}
                    />
                    <TotalRow
                      label="Kembalian"
                      value={formatCurrency(transaction.change ?? 0)}
                    />
                  </>
                ) : null}
              </dl>

              <p className="mt-4 text-xs text-muted-foreground">
                Kasir: <span className="font-medium text-foreground">{transaction.cashier}</span>
              </p>

              {transaction.status === 'voided' ? (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                  <BanIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Dibatalkan: {transaction.voidReason ?? 'Tanpa alasan'}
                </p>
              ) : null}
            </div>

            <SheetFooter className="border-t">
              <Button variant="outline" onClick={handlePrint}>
                <PrinterIcon aria-hidden="true" />
                Cetak struk
              </Button>
              {transaction.status === 'completed' ? (
                <Button
                  variant="destructive"
                  onClick={() => onVoid(transaction)}
                >
                  <BanIcon aria-hidden="true" />
                  Batalkan
                </Button>
              ) : null}
            </SheetFooter>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Transaksi tidak ditemukan</SheetTitle>
            <SheetDescription>
              Pilih transaksi dari daftar untuk melihat detailnya.
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoCell({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof UserIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{children}</dd>
    </div>
  )
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success'
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === 'success'
            ? 'font-medium text-success tabular-nums'
            : 'font-medium tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
