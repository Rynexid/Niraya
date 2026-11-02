import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function TablePagination({
  page,
  pageCount,
  total,
  start,
  end,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  total: number
  start: number
  end: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (total === 0) return null

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="tabular-nums">
        Menampilkan {start + 1}–{end} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
          Sebelumnya
        </Button>
        <span className="px-1 tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
