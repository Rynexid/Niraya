import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ActivityIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import type { ActivityItem } from '@/lib/business-selectors'

export function RecentActivity({
  items,
  className,
}: {
  items: ActivityItem[]
  className?: string
}) {
  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className ?? ''}`}>
      <div className="p-5 pb-2">
        <h2 className="text-sm font-semibold">Recent Activity</h2>
        <p className="text-xs text-muted-foreground">
          Pembaruan terakhir dari toko
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-4 pt-2">
          <EmptyState
            icon={ActivityIcon}
            title="Belum ada aktivitas"
            description="Penjualan dan penyesuaian stok akan tercatat di sini."
            className="py-8"
          />
        </div>
      ) : (
        <div className="flex flex-col px-5 pb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-2">
              <div className="mt-1">
                <span className={`block size-2 rounded-full ${item.color}`} />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm leading-tight">{item.text}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.time), {
                    addSuffix: true,
                    locale: localeId,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
