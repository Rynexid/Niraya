import { ExternalLinkIcon, ReceiptTextIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { RecentTransaction } from '@/types/dashboard'

export function RecentTransactions({
  transactions,
  className,
}: {
  transactions: RecentTransaction[]
  className?: string
}) {
  return (
    <div className={`rounded-xl border bg-card shadow-sm ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-2 p-5 pb-2">
        <div>
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <p className="text-xs text-muted-foreground">
            Pembayaran terakhir dari seluruh kanal
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link to="/transactions">
            <ExternalLinkIcon aria-hidden="true" className="mr-1 size-3.5" />
            View all
          </Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="p-4 pt-2">
          <EmptyState
            icon={ReceiptTextIcon}
            title="Belum ada transaksi"
            description="Transaksi muncul di sini setelah pembayaran pertama diselesaikan di POS."
            className="py-8"
          />
        </div>
      ) : (
        <div className="overflow-x-auto px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9">Order ID</TableHead>
                <TableHead className="h-9">Customer</TableHead>
                <TableHead className="h-9">Date &amp; Time</TableHead>
                <TableHead className="h-9">Payment</TableHead>
                <TableHead className="h-9 text-right">Amount</TableHead>
                <TableHead className="h-9 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="py-2.5 font-medium">
                    {transaction.id}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {transaction.customer}
                  </TableCell>
                  <TableCell className="py-2.5 text-muted-foreground">
                    {formatDateTime(transaction.date)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    {transaction.paymentMethod}
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">
                    {formatCurrency(transaction.total)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <StatusBadge status={transaction.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
