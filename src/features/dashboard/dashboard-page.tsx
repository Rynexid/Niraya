import { useMemo } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopProducts } from '@/components/dashboard/top-products'
import { TransactionOverview } from '@/components/dashboard/transaction-overview'
import { Button } from '@/components/ui/button'
import { PAYMENT_METHOD_LABELS } from '@/lib/business-labels'
import {
  getDashboardMetrics,
  getLowStockProducts,
  getRecentActivity,
  getRevenueSeries,
  getTopProducts,
  getTransactionStats,
} from '@/lib/business-selectors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { RecentTransaction } from '@/types/dashboard'

export function DashboardPage() {
  const { transactions, products, categories, movements } = useBusinessStore()

  const metrics = useMemo(
    () => getDashboardMetrics(transactions),
    [transactions],
  )
  const series = useMemo(
    () => getRevenueSeries(transactions, 14),
    [transactions],
  )
  const stats = useMemo(
    () => getTransactionStats(transactions),
    [transactions],
  )
  const topProducts = useMemo(
    () => getTopProducts(transactions, products, categories, 5),
    [transactions, products, categories],
  )
  const activity = useMemo(
    () => getRecentActivity(transactions, movements, 5),
    [transactions, movements],
  )
  const lowStock = useMemo(() => getLowStockProducts(products), [products])

  const recentTransactions = useMemo<RecentTransaction[]>(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
        .map((transaction) => ({
          id: transaction.number,
          customer: transaction.customerName,
          date: new Date(transaction.createdAt),
          paymentMethod: PAYMENT_METHOD_LABELS[transaction.paymentMethod],
          total: transaction.total,
          status: transaction.status,
        })),
    [transactions],
  )

  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader />

      {lowStock.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <TriangleAlertIcon aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {formatNumber(lowStock.length)} produk perlu diisi ulang
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lowStock
                  .slice(0, 3)
                  .map((product) => product.name)
                  .join(', ')}
                {lowStock.length > 3 ? `, +${lowStock.length - 3} lainnya` : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory">Buka inventori</Link>
          </Button>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={
              metric.format === 'currency'
                ? formatCurrency(metric.value)
                : formatNumber(metric.value)
            }
            change={metric.change}
            trend={metric.trend}
            icon={metric.icon}
            period={metric.period}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RevenueChart
          data={series}
          title="Revenue Analytics"
          subtitle="Pendapatan transaksi selesai · 14 hari terakhir"
          className="xl:col-span-2"
        />
        <TransactionOverview stats={stats} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TopProducts products={topProducts} />
        <RecentActivity items={activity} />
      </section>

      <section className="grid gap-4">
        <RecentTransactions transactions={recentTransactions} />
      </section>
    </div>
  )
}
