import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

type StatusMeta = {
  label: string
  variant: BadgeVariant
}

const STATUS_MAP: Record<string, StatusMeta> = {
  active: { label: 'Aktif', variant: 'success' },
  archived: { label: 'Diarsipkan', variant: 'secondary' },
  inactive: { label: 'Nonaktif', variant: 'secondary' },
  completed: { label: 'Selesai', variant: 'success' },
  voided: { label: 'Dibatalkan', variant: 'destructive' },
  refunded: { label: 'Refund', variant: 'warning' },
  in: { label: 'Masuk', variant: 'success' },
  out: { label: 'Keluar', variant: 'info' },
  adjustment: { label: 'Penyesuaian', variant: 'secondary' },
  sale: { label: 'Penjualan', variant: 'info' },
  void: { label: 'Pembatalan', variant: 'warning' },
  cash: { label: 'Tunai', variant: 'outline' },
  qris: { label: 'QRIS', variant: 'info' },
  card: { label: 'EDC', variant: 'secondary' },
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const meta = STATUS_MAP[status] ?? {
    label: status,
    variant: 'outline' as BadgeVariant,
  }

  return (
    <Badge variant={meta.variant} className={className}>
      {label ?? meta.label}
    </Badge>
  )
}
