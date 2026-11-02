"use client";

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import type { Transaction } from '@/types/business'

export function VoidTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onSubmit: (reason: string) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan transaksi?</DialogTitle>
          <DialogDescription>
            {transaction
              ? `${transaction.number} senilai ${formatCurrency(transaction.total)} akan dibatalkan. Stok produk dikembalikan dan transaksi tetap tersimpan di riwayat.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <VoidForm
          key={transaction?.id ?? 'none'}
          onCancel={() => onOpenChange(false)}
          onSubmit={(reason) => {
            if (onSubmit(reason)) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function VoidForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (reason.trim().length < 3) {
      setError('Tulis alasan pembatalan (minimal 3 karakter).')
      return
    }
    setError('')
    onSubmit(reason.trim())
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="void-reason">Alasan pembatalan</Label>
        <Textarea
          id="void-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Contoh: salah input pesanan, pelanggan membatalkan…"
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Kembali
        </Button>
        <Button type="button" variant="destructive" onClick={handleSubmit}>
          Batalkan transaksi
        </Button>
      </DialogFooter>
    </div>
  )
}
