import { format, subDays } from 'date-fns'
import {
  CreditCardIcon,
  PackageIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
} from 'lucide-react'

import { formatCurrency, formatNumber } from '@/lib/format'
import type {
  Category,
  Customer,
  PaymentMethod,
  Product,
  StockMovement,
  Transaction,
} from '@/types/business'
import type {
  MetricCard,
  RevenuePoint,
  TopProduct,
  TransactionStat,
} from '@/types/dashboard'

const DAY = 24 * 60 * 60 * 1000

export const isCompleted = (transaction: Transaction) =>
  transaction.status === 'completed'

export const isLowStock = (product: Product) =>
  product.status === 'active' && product.stock <= product.minStock

export const isOutOfStock = (product: Product) => product.stock <= 0

export function getCategoryName(
  categories: readonly Category[],
  categoryId: string,
) {
  return categories.find((category) => category.id === categoryId)?.name ?? '—'
}

export function getProductCount(
  products: readonly Product[],
  categoryId: string,
) {
  return products.filter((product) => product.categoryId === categoryId).length
}

export function getCustomerStats(
  transactions: readonly Transaction[],
  customerId: string,
) {
  const own = transactions.filter(
    (transaction) => transaction.customerId === customerId,
  )
  const completed = own.filter(isCompleted)
  const lastVisit = own.reduce<string | undefined>((latest, transaction) => {
    if (!latest) return transaction.createdAt
    return new Date(transaction.createdAt) > new Date(latest)
      ? transaction.createdAt
      : latest
  }, undefined)

  return {
    transactionCount: own.length,
    completedCount: completed.length,
    totalSpent: completed.reduce((total, transaction) => total + transaction.total, 0),
    lastVisit,
  }
}

export function getProductSales(
  transactions: readonly Transaction[],
  productId: string,
) {
  let unitsSold = 0
  let revenue = 0
  let transactionCount = 0

  for (const transaction of transactions) {
    if (!isCompleted(transaction)) continue
    const items = transaction.items.filter((item) => item.productId === productId)
    if (items.length === 0) continue

    transactionCount += 1
    for (const item of items) {
      unitsSold += item.quantity
      revenue += item.lineTotal
    }
  }

  return { unitsSold, revenue, transactionCount }
}

export function summarizeTransactions(transactions: readonly Transaction[]) {
  const completed = transactions.filter(isCompleted)
  const revenue = completed.reduce((total, transaction) => total + transaction.total, 0)
  const itemsSold = completed.reduce(
    (total, transaction) =>
      total + transaction.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  )

  return {
    count: completed.length,
    revenue,
    itemsSold,
    average: completed.length === 0 ? 0 : Math.round(revenue / completed.length),
  }
}

export function getRevenueSeries(
  transactions: readonly Transaction[],
  days = 14,
): RevenuePoint[] {
  const now = new Date()

  return Array.from({ length: days }, (_, index) => {
    const date = subDays(now, days - 1 - index)
    const key = format(date, 'yyyy-MM-dd')
    const revenue = transactions
      .filter(
        (transaction) =>
          isCompleted(transaction) &&
          format(new Date(transaction.createdAt), 'yyyy-MM-dd') === key,
      )
      .reduce((total, transaction) => total + transaction.total, 0)

    return {
      name: format(date, 'dd MMM'),
      revenue,
    }
  })
}

export function getTopProducts(
  transactions: readonly Transaction[],
  products: readonly Product[],
  categories: readonly Category[],
  limit = 5,
): TopProduct[] {
  const totals = new Map<string, { unitsSold: number; revenue: number }>()

  for (const transaction of transactions) {
    if (!isCompleted(transaction)) continue
    for (const item of transaction.items) {
      const current = totals.get(item.productId) ?? { unitsSold: 0, revenue: 0 }
      current.unitsSold += item.quantity
      current.revenue += item.lineTotal
      totals.set(item.productId, current)
    }
  }

  return Array.from(totals.entries())
    .map(([productId, value]) => {
      const product = products.find((item) => item.id === productId)
      return {
        id: productId,
        name: product?.name ?? 'Produk',
        sku: product?.sku ?? '—',
        category: product ? getCategoryName(categories, product.categoryId) : undefined,
        imageUrl: product?.imageUrl,
        unitsSold: value.unitsSold,
        revenue: value.revenue,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function getTransactionStats(
  transactions: readonly Transaction[],
): TransactionStat[] {
  return [
    {
      label: 'Selesai',
      value: transactions.filter((transaction) => transaction.status === 'completed')
        .length,
      status: 'completed',
    },
    {
      label: 'Dibatalkan',
      value: transactions.filter((transaction) => transaction.status === 'voided')
        .length,
      status: 'voided',
    },
    {
      label: 'Refund',
      value: transactions.filter((transaction) => transaction.status === 'refunded')
        .length,
      status: 'refunded',
    },
  ]
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function getDashboardMetrics(
  transactions: readonly Transaction[],
): MetricCard[] {
  const now = Date.now()
  const currentFrom = now - 7 * DAY
  const previousFrom = now - 14 * DAY

  const current = transactions.filter(
    (transaction) =>
      isCompleted(transaction) &&
      new Date(transaction.createdAt).getTime() >= currentFrom,
  )
  const previous = transactions.filter((transaction) => {
    const time = new Date(transaction.createdAt).getTime()
    return isCompleted(transaction) && time >= previousFrom && time < currentFrom
  })

  const currentSummary = summarizeTransactions(current)
  const previousSummary = summarizeTransactions(previous)

  return [
    {
      label: 'Total Pendapatan',
      value: currentSummary.revenue,
      change: percentChange(currentSummary.revenue, previousSummary.revenue),
      trend:
        currentSummary.revenue === previousSummary.revenue
          ? 'flat'
          : currentSummary.revenue > previousSummary.revenue
            ? 'up'
            : 'down',
      icon: TrendingUpIcon,
      format: 'currency',
      period: '7 hari terakhir',
    },
    {
      label: 'Transaksi',
      value: currentSummary.count,
      change: percentChange(currentSummary.count, previousSummary.count),
      trend:
        currentSummary.count === previousSummary.count
          ? 'flat'
          : currentSummary.count > previousSummary.count
            ? 'up'
            : 'down',
      icon: ShoppingCartIcon,
      format: 'number',
      period: '7 hari terakhir',
    },
    {
      label: 'Produk Terjual',
      value: currentSummary.itemsSold,
      change: percentChange(currentSummary.itemsSold, previousSummary.itemsSold),
      trend:
        currentSummary.itemsSold === previousSummary.itemsSold
          ? 'flat'
          : currentSummary.itemsSold > previousSummary.itemsSold
            ? 'up'
            : 'down',
      icon: PackageIcon,
      format: 'number',
      period: '7 hari terakhir',
    },
    {
      label: 'Rata-rata Transaksi',
      value: currentSummary.average,
      change: percentChange(currentSummary.average, previousSummary.average),
      trend:
        currentSummary.average === previousSummary.average
          ? 'flat'
          : currentSummary.average > previousSummary.average
            ? 'up'
            : 'down',
      icon: CreditCardIcon,
      format: 'currency',
      period: '7 hari terakhir',
    },
  ]
}

export function getLowStockProducts(products: readonly Product[]) {
  return products
    .filter(isLowStock)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
}

export function getPaymentBreakdown(transactions: readonly Transaction[]) {
  const completed = transactions.filter(isCompleted)
  const total = completed.reduce((sum, transaction) => sum + transaction.total, 0)

  const methods: PaymentMethod[] = ['cash', 'qris', 'card']

  return methods.map((method) => {
    const rows = completed.filter((transaction) => transaction.paymentMethod === method)
    const amount = rows.reduce((sum, transaction) => sum + transaction.total, 0)
    return {
      method,
      count: rows.length,
      amount,
      share: total === 0 ? 0 : Math.round((amount / total) * 100),
    }
  })
}

export function getCategoryPerformance(
  transactions: readonly Transaction[],
  products: readonly Product[],
  categories: readonly Category[],
) {
  const byProduct = new Map<string, { units: number; revenue: number }>()

  for (const transaction of transactions) {
    if (!isCompleted(transaction)) continue
    for (const item of transaction.items) {
      const current = byProduct.get(item.productId) ?? { units: 0, revenue: 0 }
      current.units += item.quantity
      current.revenue += item.lineTotal
      byProduct.set(item.productId, current)
    }
  }

  return categories
    .map((category) => {
      const categoryProducts = products.filter(
        (product) => product.categoryId === category.id,
      )
      const totals = categoryProducts.reduce(
        (sum, product) => {
          const value = byProduct.get(product.id) ?? { units: 0, revenue: 0 }
          return {
            units: sum.units + value.units,
            revenue: sum.revenue + value.revenue,
          }
        },
        { units: 0, revenue: 0 },
      )

      return {
        id: category.id,
        name: category.name,
        productCount: categoryProducts.length,
        ...totals,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

export type ActivityItem = {
  id: string
  text: string
  time: string
  color: string
}

export function getRecentActivity(
  transactions: readonly Transaction[],
  movements: readonly StockMovement[],
  limit = 5,
): ActivityItem[] {
  const transactionEvents: ActivityItem[] = transactions.slice(0, 8).map((transaction) => ({
    id: `activity-${transaction.id}`,
    text:
      transaction.status === 'completed'
        ? `Pesanan ${transaction.number} selesai • ${formatCurrency(transaction.total)}`
        : transaction.status === 'voided'
          ? `Pesanan ${transaction.number} dibatalkan`
          : `Refund diproses untuk ${transaction.number}`,
    time: transaction.createdAt,
    color:
      transaction.status === 'completed'
        ? 'bg-emerald-500'
        : transaction.status === 'voided'
          ? 'bg-destructive'
          : 'bg-amber-500',
  }))

  const movementEvents: ActivityItem[] = movements.slice(0, 5).map((movement) => ({
    id: `activity-${movement.id}`,
    text: `${movement.productName}: ${movement.quantity > 0 ? '+' : ''}${formatNumber(movement.quantity)} ${movement.type === 'sale' ? 'terjual' : 'stok disesuaikan'}`,
    time: movement.createdAt,
    color: movement.quantity < 0 ? 'bg-sky-500' : 'bg-violet-500',
  }))

  return [...transactionEvents, ...movementEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
}

export function getCustomerLabel(
  customers: readonly Customer[],
  customerId?: string,
) {
  if (!customerId) return 'Walk-in Customer'
  return (
    customers.find((customer) => customer.id === customerId)?.name ??
    'Walk-in Customer'
  )
}
