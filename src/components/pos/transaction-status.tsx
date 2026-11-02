import {
  BanIcon,
  CircleCheckIcon,
  CircleDollarSignIcon,
  ClockIcon,
  RotateCcwIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TransactionStatus as TransactionStatusValue } from '@/types/pos'

type StatusConfig = {
  label: string
  variant: 'warning' | 'success' | 'info' | 'destructive'
  icon: LucideIcon
}

const statusConfig: Record<TransactionStatusValue, StatusConfig> = {
  pending: { label: 'Pending', variant: 'warning', icon: ClockIcon },
  paid: { label: 'Paid', variant: 'success', icon: CircleCheckIcon },
  'partially-paid': {
    label: 'Partially paid',
    variant: 'info',
    icon: CircleDollarSignIcon,
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    icon: CircleCheckIcon,
  },
  refunded: { label: 'Refunded', variant: 'info', icon: RotateCcwIcon },
  voided: { label: 'Voided', variant: 'destructive', icon: BanIcon },
}

type TransactionStatusProps = {
  status: TransactionStatusValue
  className?: string
}

/** Transaction state badge with an icon and a text label. */
export function TransactionStatus({
  status,
  className,
}: TransactionStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn('gap-1.5', className)}
    >
      <Icon aria-hidden="true" className="size-3" />
      {config.label}
    </Badge>
  )
}
