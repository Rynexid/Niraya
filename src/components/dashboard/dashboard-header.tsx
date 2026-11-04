import { BarChart3Icon, ShoppingBagIcon } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

/**
 * Dashboard header. Actions link to real screens instead of placeholder
 * controls, so nothing here implies a feature that is not wired.
 */
export function DashboardHeader() {
  return (
    <PageHeader
      title="Dashboard"
      description="Ringkasan performa bisnis dari transaksi dan stok yang tersimpan di database."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href="/reports">
              <BarChart3Icon aria-hidden="true" />
              Laporan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/pos">
              <ShoppingBagIcon aria-hidden="true" />
              Buka POS
            </Link>
          </Button>
        </>
      }
    />
  )
}
