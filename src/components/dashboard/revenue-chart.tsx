import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { TrendingUpIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { RevenuePoint } from '@/types/dashboard'

const chartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

/**
 * Revenue trend. Accepts prepared points (`name` + `revenue`) so the dashboard
 * and reports share the same chart while reading from the same store.
 */
export function RevenueChart({
  data,
  title = 'Tren pendapatan',
  subtitle = 'Pendapatan transaksi selesai',
  className,
}: {
  data: RevenuePoint[]
  title?: string
  subtitle?: string
  className?: string
}) {
  const total = data.reduce((sum, point) => sum + point.revenue, 0)

  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className || ''}`}>
      <div className="flex items-center justify-between p-5 pb-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="px-2 pb-4">
        {total === 0 ? (
          <EmptyState
            icon={TrendingUpIcon}
            title="Belum ada pendapatan"
            description="Grafik terisi setelah ada transaksi selesai pada periode ini."
            className="mx-2 border-0 bg-transparent py-10"
          />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent labelFormatter={(value) => value} />
                }
              />
              <Line
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
