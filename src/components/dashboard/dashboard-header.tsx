import { BarChart3Icon, ShoppingBagIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DemoDataBadge } from '@/components/shared/demo-data-badge'
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
      description="Ringkasan performa bisnis dari transaksi dan stok yang tersimpan di perangkat ini."
      badge={<DemoDataBadge />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/reports">
              <BarChart3Icon aria-hidden="true" />
              Laporan
            </Link>
          </Button>
          <Button asChild>
            <Link to="/pos">
              <ShoppingBagIcon aria-hidden="true" />
              Buka POS
            </Link>
          </Button>
        </>
      }
    />
  )
}
