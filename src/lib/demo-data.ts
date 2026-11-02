import { subDays, format } from 'date-fns'

import { formatCurrency, formatNumber } from '@/lib/format'
import {
  CreditCardIcon,
  PackageIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
} from 'lucide-react'
import type {
  MetricCard,
  RecentTransaction,
  RevenuePoint,
  TopProduct,
  TransactionStat,
} from '@/types/dashboard'

/**
 * Illustrative sample data used only to demonstrate the dashboard UI.
 * These values are not real business data and are not fetched from a server.
 * Replace with TanStack Query + API calls once the backend stage is built.
 */

export const DEMO_METRICS: readonly MetricCard[] = [
  {
    label: 'Total Revenue',
    value: 14_250_000,
    change: 12.4,
    trend: 'up',
    icon: TrendingUpIcon,
    format: 'currency',
    period: 'vs previous period',
  },
  {
    label: 'Total Transactions',
    value: 1_240,
    change: -3.2,
    trend: 'down',
    icon: ShoppingCartIcon,
    format: 'number',
    period: 'vs previous period',
  },
  {
    label: 'Products Sold',
    value: 3_420,
    change: 8.1,
    trend: 'up',
    icon: PackageIcon,
    format: 'number',
    period: 'vs previous period',
  },
  {
    label: 'Average Transaction',
    value: 11_492,
    change: 2.5,
    trend: 'up',
    icon: CreditCardIcon,
    format: 'currency',
    period: 'vs previous period',
  },
]

/**
 * Format a demo metric value for display. Kept separate from the presentational
 * `RevenueMetric` component so this file stays data-only.
 */
export function formatDemoMetric(card: MetricCard): string {
  if (card.format === 'number') {
    return formatNumber(card.value as number)
  }
  return formatCurrency(card.value as number, card.currency)
}

/** Generate the last `days` days of revenue data (current + previous period). */
export function generateRevenueData(days = 14): RevenuePoint[] {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i)
    const base = Math.round(3_500_000 + Math.sin(i / 2) * 1_200_000 + i * 50_000)
    return {
      name: format(date, 'EEE dd'),
      revenue: base,
      previous: Math.round(base * 0.9),
    }
  })
}

export const DEMO_TRANSACTION_STATS: readonly TransactionStat[] = [
  { label: 'Completed', value: 984, status: 'completed' },
  { label: 'Pending', value: 156, status: 'pending' },
  { label: 'Cancelled', value: 100, status: 'voided' },
]

export const DEMO_TOP_PRODUCTS: readonly TopProduct[] = [
  { id: 'p1', name: 'Espresso Blend', sku: 'BEV-001', unitsSold: 342, revenue: 855000 },
  { id: 'p2', name: 'Cappuccino', sku: 'BEV-002', unitsSold: 298, revenue: 894000 },
  { id: 'p3', name: 'Croissant', sku: 'BAK-001', unitsSold: 215, revenue: 430000 },
  { id: 'p4', name: 'Latte', sku: 'BEV-003', unitsSold: 189, revenue: 567000 },
  { id: 'p5', name: 'Iced Americano', sku: 'BEV-004', unitsSold: 172, revenue: 344000 },
]

export const DEMO_RECENT_TRANSACTIONS: readonly RecentTransaction[] = [
  {
    id: 'INV-1024',
    customer: 'Aulia Rahma',
    date: new Date(),
    paymentMethod: 'Cash',
    total: 45000,
    status: 'completed',
  },
  {
    id: 'INV-1023',
    customer: 'Budi Santoso',
    date: subDays(new Date(), 1),
    paymentMethod: 'QRIS',
    total: 120000,
    status: 'paid',
  },
  {
    id: 'INV-1022',
    customer: 'Citra Dewi',
    date: subDays(new Date(), 2),
    paymentMethod: 'Credit Card',
    total: 67500,
    status: 'pending',
  },
  {
    id: 'INV-1021',
    customer: 'Dedi Kurniawan',
    date: subDays(new Date(), 3),
    paymentMethod: 'Cash',
    total: 23000,
    status: 'completed',
  },
  {
    id: 'INV-1020',
    customer: 'Eka Putri',
    date: subDays(new Date(), 4),
    paymentMethod: 'QRIS',
    total: 98000,
    status: 'voided',
  },
]

export const DEMO_REVENUE_DATA: readonly RevenuePoint[] = generateRevenueData(14)
