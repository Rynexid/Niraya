"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  ArmchairIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserIcon,
  UtensilsIcon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ReceiptPreview } from '@/components/pos/receipt-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BusinessSettings, CompletedSale } from '@/types/business'
import type { PosCartLine } from '../hooks/use-pos-cart'
import {
  ORDER_TYPE_LABELS,
  sanitizeTableNumber,
  type PosOrderType,
} from '../lib/order'
import { printQris, printReceipt } from '../lib/print'
import { buildQrisPayload, DEMO_MERCHANT } from '../lib/qris'
import type { PosTotals } from '../lib/pricing'

type PaymentMethod = 'cash' | 'qris' | 'card'

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  hint: string
  icon: typeof BanknoteIcon
}[] = [
  { id: 'cash', label: 'Tunai', hint: 'Uang cash', icon: BanknoteIcon },
  { id: 'qris', label: 'QRIS', hint: 'Scan QR', icon: QrCodeIcon },
  { id: 'card', label: 'EDC', hint: 'Kartu', icon: CreditCardIcon },
]

/** Receipt header rows that describe how the order is served. */
function buildReceiptDetails(
  orderType: PosOrderType,
  tableNumber: string,
  customerName: string,
) {
  const details = [
    { label: 'Pelanggan', value: customerName },
    { label: 'Tipe', value: ORDER_TYPE_LABELS[orderType] },
  ]

  if (orderType === 'dine-in') {
    details.push({ label: 'Bangku', value: tableNumber.trim() || '-' })
  }

  return details
}

type ReceiptSnapshot = {
  orderId: string
  lines: PosCartLine[]
  totals: PosTotals
  method: PaymentMethod
  cashReceived: number
  change: number
  paidAt: Date
  orderType: PosOrderType
  tableNumber: string
  customerName: string
  cashierName: string
  storeName: string
  receiptFooter: string
}

export type CheckoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  lines: PosCartLine[]
  itemCount: number
  totals: PosTotals
  orderType: PosOrderType
  tableNumber: string
  customerId?: string
  customerName: string
  cashierName: string
  settings: BusinessSettings
  onTableNumberChange: (tableNumber: string) => void
  /**
   * Persist the completed sale. Returns the stored transaction number so the
   * success screen and printed receipt match the transactions table.
   */
  onComplete: (sale: CompletedSale) => string
  onSuccess?: (serverReceipt: any) => void
}

/**
 * Two-step checkout: review + tender, then a printable success receipt. The
 * body unmounts whenever the dialog closes, so each order starts fresh.
 */
export function CheckoutDialog({
  open,
  onOpenChange,
  ...bodyProps
}: CheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-[calc(100%-1rem)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <CheckoutBody {...bodyProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type CheckoutBodyProps = Omit<CheckoutDialogProps, 'open' | 'onOpenChange'> & {
  onClose: () => void
}

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function CheckoutBody({
  orderId,
  lines,
  itemCount,
  totals,
  orderType,
  tableNumber,
  customerId,
  customerName,
  cashierName,
  settings,
  onTableNumberChange,
  onComplete,
  onSuccess,
  onClose,
}: CheckoutBodyProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashInput, setCashInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null)
  const timerRef = useRef<number | null>(null)
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey())

  const cashValue = Number(cashInput || 0)
  const busy = status !== 'idle'
  const dineIn = orderType === 'dine-in'
  const tableMissing = dineIn && tableNumber.trim() === ''

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const qrisPayload = useMemo(
    () =>
      buildQrisPayload({
        amount: totals.total,
        orderId,
      }),
    [orderId, totals.total],
  )

  // Build the QR only while the QRIS tab is waiting for payment.
  useEffect(() => {
    if (method !== 'qris' || status !== 'idle') return

    let cancelled = false

    QRCode.toString(qrisPayload, {
      type: 'svg',
      margin: 1,
      width: 512,
      errorCorrectionLevel: 'M',
      // Pure black on white is required for scanner contrast.
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((svg) => {
        if (cancelled) return
        setQrDataUrl(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        )
      })
      .catch(() => {
        if (!cancelled) toast.error('Gagal membuat kode QRIS')
      })

    return () => {
      cancelled = true
    }
  }, [method, status, qrisPayload])

  const handlePay = async () => {
    if (busy) return

    if (tableMissing) {
      toast.error('Nomor bangku belum diisi', {
        description: 'Isi nomor bangku untuk pesanan dine in.',
      })
      return
    }

    if (method === 'cash' && cashValue < totals.total) {
      toast.error('Uang diterima belum cukup', {
        description: `Kurang ${formatCurrency(totals.total - cashValue)}`,
      })
      return
    }

    const paidAt = new Date()
    const cashReceived = method === 'cash' ? cashValue : totals.total
    const change =
      method === 'cash' ? Math.max(0, cashValue - totals.total) : 0

    const sale: CompletedSale = {
      orderId,
      paidAt: paidAt.toISOString(),
      cashier: cashierName,
      customerId,
      customerName,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber.trim() : undefined,
      items: lines.map((line) => ({
        productId: line.product.id,
        name: line.product.name,
        sku: line.product.sku ?? '',
        quantity: line.quantity,
        unitPrice: line.product.price,
        lineTotal: line.product.price * line.quantity,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: method,
      cashReceived,
      change,
    }

    setStatus('processing')

    try {
      const payload = {
        idempotencyKey: idempotencyKeyRef.current,
        items: lines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
        paymentMethod: method,
        paymentAmount: method === 'cash' ? cashValue : totals.total,
      }

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Checkout failed')
      }

      const serverResult = await res.json()

      const storedNumber = onComplete(sale)

      setReceipt({
        orderId: serverResult.transactionNumber || storedNumber,
        lines,
        totals,
        method,
        cashReceived: serverResult.amountPaid ?? cashReceived,
        change: serverResult.changeAmount ?? change,
        paidAt: new Date(serverResult.createdAt || paidAt),
        orderType,
        tableNumber,
        customerName,
        cashierName,
        storeName: settings.businessName,
        receiptFooter: settings.receiptFooter,
      })
      setStatus('success')
      if (onSuccess) onSuccess(serverResult)
      toast.success('Pembayaran berhasil', {
        description: `${formatNumber(itemCount)} item • ${formatCurrency(serverResult.total ?? totals.total)}`,
      })
    } catch (error: any) {
      setStatus('idle')
      toast.error('Pembayaran gagal', {
        description: error.message || 'Terjadi kesalahan saat checkout',
      })
    }
  }

  const handlePrintReceipt = () => {
    if (!receipt) return

    const ok = printReceipt({
      orderId: receipt.orderId,
      date: receipt.paidAt,
      lines: receipt.lines.map((line) => ({
        id: line.product.id,
        name: line.product.name,
        quantity: line.quantity,
        unitPrice: line.product.price,
      })),
      totals: receipt.totals,
      paymentMethod:
        PAYMENT_METHODS.find((option) => option.id === receipt.method)?.label ??
        'Tunai',
      cashReceived: receipt.cashReceived,
      change: receipt.change,
      cashier: receipt.cashierName,
      storeName: receipt.storeName,
      logoUrl: '/Logo.png',
      details: buildReceiptDetails(
        receipt.orderType,
        receipt.tableNumber,
        receipt.customerName,
      ),
    })

    if (!ok) {
      toast.error('Popup diblokir', {
        description: 'Izinkan popup untuk mencetak struk.',
      })
    }
  }

  const handlePrintQris = () => {
    const ok = printQris({
      orderId: receipt?.orderId ?? orderId,
      amount: receipt?.totals.total ?? totals.total,
      qrDataUrl,
      merchantName: DEMO_MERCHANT.name,
      merchantCity: DEMO_MERCHANT.city,
      nmid: DEMO_MERCHANT.nmid,
      logoUrl: '/Logo.png',
    })

    if (!ok) {
      toast.error('Popup diblokir', {
        description: 'Izinkan popup untuk mencetak QRIS.',
      })
    }
  }

  if (status === 'success' && receipt) {
    const paidLabel =
      PAYMENT_METHODS.find((option) => option.id === receipt.method)?.label ??
      'Tunai'
    const receiptItems = receipt.lines.map((line) => ({
      id: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      unitPrice: line.product.price,
    }))
    const paidItemCount = receiptItems.reduce(
      (total, item) => total + item.quantity,
      0,
    )

    return (
      <div className="flex max-h-[92svh] flex-col">
        <div className="flex flex-col items-center gap-3 border-b p-5 pr-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2Icon aria-hidden="true" className="size-7" />
          </span>
          <div>
            <DialogTitle className="text-lg font-bold">
              Pembayaran berhasil
            </DialogTitle>
            <DialogDescription className="mt-1">
              {formatNumber(paidItemCount)} item &bull;{' '}
              {formatCurrency(receipt.totals.total)}
            </DialogDescription>
          </div>
          <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
            #{receipt.orderId}
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4">
          <ReceiptPreview
            transactionId={receipt.orderId}
            date={receipt.paidAt}
            items={receiptItems}
            subtotal={receipt.totals.subtotal}
            discount={receipt.totals.discount}
            tax={receipt.totals.tax}
            total={receipt.totals.total}
            paymentMethod={paidLabel}
            cashier={receipt.cashierName}
            storeName={receipt.storeName}
            logoSrc="/Logo.png"
            details={buildReceiptDetails(
              receipt.orderType,
              receipt.tableNumber,
              receipt.customerName,
            )}
            footer={receipt.receiptFooter || 'Terima kasih • Niraya'}
            labels={{
              receipt: 'No. struk',
              date: 'Waktu',
              cashier: 'Kasir',
              subtotal: 'Subtotal',
              discount: 'Diskon',
              tax: 'Pajak',
              total: 'Total',
              paidWith: 'Dibayar dengan',
            }}
          />
        </div>

        <div className="grid gap-2 border-t p-4 sm:grid-cols-2">
          <Button variant="outline" onClick={handlePrintReceipt}>
            <PrinterIcon aria-hidden="true" />
            Cetak Struk
          </Button>
          {receipt.method === 'qris' ? (
            <Button
              variant="outline"
              onClick={handlePrintQris}
              disabled={!qrDataUrl}
            >
              <QrCodeIcon aria-hidden="true" />
              Cetak QRIS
            </Button>
          ) : (
            <div aria-hidden="true" className="hidden sm:block" />
          )}
          <Button className="sm:col-span-2" onClick={onClose}>
            <PlusIcon aria-hidden="true" />
            Transaksi Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-h-[92svh] flex-col">
      <DialogHeader className="gap-1 border-b p-4 pr-12">
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-base font-bold">Pembayaran</DialogTitle>
          <Badge
            variant="secondary"
            className="font-mono text-[11px] tabular-nums"
          >
            #{orderId}
          </Badge>
        </div>
        <DialogDescription>
          Periksa pesanan, pilih metode, lalu konfirmasi pembayaran.
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
        <section
          aria-label="Rincian pesanan"
          className="order-2 flex flex-col gap-3 md:order-1"
        >
          <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Rincian pesanan
          </h3>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold">
              {dineIn ? (
                <UtensilsIcon aria-hidden="true" className="size-4 text-primary" />
              ) : (
                <ShoppingBagIcon
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
              )}
              {ORDER_TYPE_LABELS[orderType]}
            </span>

            {dineIn ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="checkout-table-number"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <ArmchairIcon aria-hidden="true" className="size-3.5" />
                  Bangku
                </label>
                <Input
                  id="checkout-table-number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={tableNumber}
                  disabled={busy}
                  onChange={(event) =>
                    onTableNumberChange(sanitizeTableNumber(event.target.value))
                  }
                  placeholder="—"
                  aria-label="Nomor bangku"
                  aria-invalid={tableMissing}
                  className="h-8 w-16 border-border bg-background px-1 text-center text-sm font-semibold tabular-nums"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
              <UserIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
              <span className="truncate">{customerName}</span>
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Pelanggan
            </span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {lines.map((line) => (
              <li
                key={line.product.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(line.quantity)} &times;{' '}
                    {formatCurrency(line.product.price)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(line.product.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <Separator />

          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(totals.subtotal)}
              </dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Diskon member</dt>
                <dd className="font-medium text-success tabular-nums">
                  -{formatCurrency(totals.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                Pajak ({formatNumber(settings.taxRate * 100)}%)
              </dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(totals.tax)}
              </dd>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 border-t pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="text-base font-bold text-primary tabular-nums">
                {formatCurrency(totals.total)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-label="Metode pembayaran"
          className="order-1 flex flex-col gap-3 md:order-2"
        >
          <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Metode pembayaran
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((option) => {
              const Icon = option.icon
              const active = method === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  disabled={busy}
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary/50 bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                    busy && 'pointer-events-none opacity-60',
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {option.label}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            {method === 'cash' ? (
              <CashPanel
                total={totals.total}
                value={cashInput}
                onChange={setCashInput}
                disabled={busy}
              />
            ) : null}
            {method === 'qris' ? (
              <QrisPanel
                qrDataUrl={qrDataUrl}
                total={totals.total}
                onPrint={handlePrintQris}
                disabled={busy}
              />
            ) : null}
            {method === 'card' ? <CardPanel total={totals.total} /> : null}
          </div>
        </section>
      </div>

      <footer className="flex flex-col gap-2 border-t bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Total tagihan</span>
          <span className="text-xl font-bold tabular-nums">
            {formatCurrency(totals.total)}
          </span>
        </div>

        <Button
          size="lg"
          onClick={handlePay}
          disabled={busy || tableMissing}
          className="h-12 w-full gap-2 text-[15px] font-bold"
        >
          {status === 'processing' ? (
            <Loader2Icon aria-hidden="true" className="size-5 animate-spin" />
          ) : method === 'qris' ? (
            <QrCodeIcon aria-hidden="true" className="size-5" />
          ) : (
            <WalletIcon aria-hidden="true" className="size-5" />
          )}
          {status === 'processing'
            ? 'Memproses…'
            : method === 'qris'
              ? 'Cek Pembayaran'
              : 'Bayar Sekarang'}
        </Button>

        {tableMissing ? (
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-destructive">
            <ArmchairIcon aria-hidden="true" className="size-3.5" />
            Isi nomor bangku dulu untuk pesanan dine in.
          </p>
        ) : (
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
            Demo — pembayaran disimulasikan, tidak ada transaksi sungguhan.
          </p>
        )}
      </footer>
    </div>
  )
}

type CashPanelProps = {
  total: number
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

function CashPanel({ total, value, onChange, disabled }: CashPanelProps) {
  const cash = Number(value || 0)
  const change = cash - total
  const quickAmounts = Array.from(
    new Set([total, 50_000, 100_000, 200_000].filter((amount) => amount >= total)),
  ).slice(0, 3)

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="cash-received"
        className="text-xs font-medium text-muted-foreground"
      >
        Uang diterima
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          Rp
        </span>
        <Input
          id="cash-received"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, '').slice(0, 9))
          }
          placeholder={formatNumber(total)}
          className="h-11 pl-9 text-right text-base font-semibold tabular-nums"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {quickAmounts.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(String(amount))}
            className="truncate text-[11px] tabular-nums"
          >
            {amount === total ? 'Uang Pas' : formatCurrency(amount)}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {change >= 0 ? 'Kembalian' : 'Kurang'}
        </span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            change >= 0 ? 'text-success' : 'text-destructive',
          )}
        >
          {formatCurrency(Math.abs(change))}
        </span>
      </div>
    </div>
  )
}

type QrisPanelProps = {
  qrDataUrl: string
  total: number
  onPrint: () => void
  disabled: boolean
}

function QrisPanel({ qrDataUrl, total, onPrint, disabled }: QrisPanelProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg border bg-white p-2">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Kode QRIS" className="size-40" />
        ) : (
          <div className="size-40 animate-pulse rounded bg-muted" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-bold tabular-nums">
          {formatCurrency(total)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          NMID {DEMO_MERCHANT.nmid}
        </p>
      </div>

      <Badge variant="secondary" className="gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />
        Menunggu pembayaran
      </Badge>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPrint}
        disabled={disabled || !qrDataUrl}
        className="gap-1.5"
      >
        <PrinterIcon aria-hidden="true" />
        Cetak QRIS
      </Button>
    </div>
  )
}

function CardPanel({ total }: { total: number }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CreditCardIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm font-semibold">Mesin EDC</p>
      <p className="text-xs text-muted-foreground">
        Tempelkan atau gesek kartu pada mesin EDC, lalu konfirmasi pembayaran.
      </p>
      <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
    </div>
  )
}
