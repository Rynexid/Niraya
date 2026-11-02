import { useState } from 'react'

/**
 * Client-side pagination with clamping. Keeps the page valid when filters
 * shrink the result set without an extra render-triggering effect.
 */
export function usePagination(total: number, pageSize = 10) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const end = Math.min(start + pageSize, total)

  return {
    page: currentPage,
    pageCount,
    pageSize,
    start,
    end,
    setPage,
    reset: () => setPage(1),
  }
}
