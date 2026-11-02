import { useMemo } from 'react'
import { Label, Pie, PieChart } from 'recharts'
import { ExternalLinkIcon, PieChartIcon } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { TransactionStat } from '@/types/dashboard'

const chartConfig = {
  value: {
    label: 'Orders',
  },
  completed: {
    label: 'Selesai',
    color: 'var(--chart-1)',
  },
  voided: {
    label: 'Dibatalkan',
    color: 'var(--chart-3)',
  },
  refunded: {
    label: 'Refund',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const STATUS_FILL: Record<string, string> = {
  completed: 'var(--chart-1)',
  voided: 'var(--chart-3)',
  refunded: 'var(--chart-2)',
}

export function TransactionOverview({ stats }: { stats: TransactionStat[] }) {
  const data = useMemo(
    () =>
      stats.map((stat) => ({
        name: stat.label,
        value: stat.value,
        fill: STATUS_FILL[stat.status] ?? 'var(--chart-4)',
      })),
    [stats],
  )

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  )

  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 p-5 pb-0">
        <div>
          <h2 className="text-sm font-semibold">Transaction Overview</h2>
          <p className="text-xs text-muted-foreground">
            Status pemenuhan pesanan
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link href="/transactions">
            <ExternalLinkIcon aria-hidden="true" className="mr-1 size-3.5" />
            View all
          </Link>
        </Button>
      </div>

      {total === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={PieChartIcon}
            title="Belum ada transaksi"
            description="Grafik status muncul setelah ada transaksi tersimpan."
            className="border-0 bg-transparent py-8"
          />
        </div>
      ) : (
        <>
          <div className="px-2 pb-2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-xl font-bold"
                            >
                              {total.toLocaleString('id-ID')}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              Transaksi
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 px-5 pb-4">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name}
                </span>
                <span className="text-xs font-medium tabular-nums">
                  {item.value.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
