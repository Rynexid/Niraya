import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton
              key={column}
              className={column === 0 ? 'h-5 w-full max-w-40' : 'h-4 w-2/3'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
