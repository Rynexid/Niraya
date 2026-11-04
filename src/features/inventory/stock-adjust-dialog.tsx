"use client";

import { useState } from 'react'
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/business'
import type { StockAdjustMode } from '@/stores/business-store'

const MODES: {
  id: StockAdjustMode
  label: string
  hint: string
  icon: typeof ArrowDownToLineIcon
}[] = [
  {
    id: 'in',
    label: 'Stok masuk',
    hint: 'Tambahkan stok',
    icon: ArrowDownToLineIcon,
  },
  {
    id: 'out',
    label: 'Stok keluar',
    hint: 'Kurangi stok',
    icon: ArrowUpFromLineIcon,
  },
  {
    id: 'adjustment',
    label: 'Set stok',
    hint: 'Samakan dengan hitungan',
    icon: SlidersHorizontalIcon,
  },
]

export type StockAdjustValues = {
  productId: string
  mode: StockAdjustMode
  quantity: number
  note: string
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  products,
  preselectedProductId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: readonly Product[]
  preselectedProductId?: string
  onSubmit: (values: StockAdjustValues) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sesuaikan stok</DialogTitle>
          <DialogDescription>
            Setiap perubahan stok tercatat di riwayat dan tidak bisa dihapus.
          </DialogDescription>
        </DialogHeader>

        <StockAdjustBody
          key={preselectedProductId ?? 'any'}
          products={products}
          preselectedProductId={preselectedProductId}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (onSubmit(values)) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function StockAdjustBody({
  products,
  preselectedProductId,
  onCancel,
  onSubmit,
}: {
  products: readonly Product[]
  preselectedProductId?: string
  onCancel: () => void
  onSubmit: (values: StockAdjustValues) => void
}) {
  const initialProductId =
    preselectedProductId && products.some((product) => product.id === preselectedProductId)
      ? preselectedProductId
      : (products[0]?.id ?? '')

  const [productId, setProductId] = useState(initialProductId)
  const [mode, setMode] = useState<StockAdjustMode>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const product = products.find((item) => item.id === productId)
  const numericQuantity = Number(quantity || 0)
  const currentStock = product?.stock ?? 0
  const resultingStock =
    mode === 'in'
      ? currentStock + numericQuantity
      : mode === 'out'
        ? currentStock - numericQuantity
        : numericQuantity

  const handleSubmit = () => {
    if (!product) {
      setError('Pilih produk terlebih dahulu.')
      return
    }
    if (!Number.isFinite(numericQuantity) || numericQuantity < 0) {
      setError('Jumlah stok tidak valid.')
      return
    }
    if (mode !== 'adjustment' && numericQuantity <= 0) {
      setError('Jumlah harus lebih dari 0.')
      return
    }
    if (resultingStock < 0) {
      setError('Stok akhir tidak boleh negatif.')
      return
    }

    setError('')
    onSubmit({
      productId: product.id,
      mode,
      quantity: numericQuantity,
      note: note.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock-product">Produk</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger id="stock-product">
            <SelectValue placeholder="Pilih produk" />
          </SelectTrigger>
          <SelectContent>
            {products.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} · {formatNumber(item.stock)} {item.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Jenis penyesuaian</Label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((option) => {
            const Icon = option.icon
            const active = mode === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(option.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-semibold transition-colors',
                  active
                    ? 'border-primary/50 bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock-quantity">
            {mode === 'adjustment' ? 'Stok hasil hitung' : 'Jumlah'}
          </Label>
          <Input
            id="stock-quantity"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={quantity}
            aria-invalid={Boolean(error)}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={mode === 'adjustment' ? String(currentStock) : '0'}
          />
        </div>

        <div className="flex flex-col justify-end rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[11px] text-muted-foreground">Stok setelah disimpan</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatNumber(Math.max(0, resultingStock))}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              {product?.unit ?? 'pcs'}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Sekarang {formatNumber(currentStock)} {product?.unit ?? 'pcs'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock-note">Catatan</Label>
        <Textarea
          id="stock-note"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contoh: kiriman dari supplier, stok opname…"
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Simpan penyesuaian
        </Button>
      </DialogFooter>
    </div>
  )
}
