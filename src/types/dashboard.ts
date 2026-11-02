import type { LucideIcon } from 'lucide-react'
import type { TransactionStatus } from './pos'

/** A single KPI tile rendered on the dashboard. */
export type MetricCard = {
  label: string
  value: number
  /** Percentage change against the comparison period. */
  change?: number
  trend?: 'up' | 'down' | 'flat'
  icon: LucideIcon
  period?: string
  format?: 'currency' | 'number'
  currency?: string
}

/** One point on the revenue time series. */
export type RevenuePoint = {
  name: string
  revenue: number
  previous?: number
}

/** Aggregate transaction counters by status. */
export type TransactionStat = {
  label: string
  value: number
  status: TransactionStatus
}

/** A product row for the top-selling products table. */
export type TopProduct = {
  id: string
  name: string
  sku: string
  unitsSold: number
  revenue: number
  category?: string
  imageUrl?: string
}

/** A single row in the recent transactions table. */
export type RecentTransaction = {
  id: string
  customer: string
  date: Date
  paymentMethod: string
  total: number
  status: TransactionStatus
}
