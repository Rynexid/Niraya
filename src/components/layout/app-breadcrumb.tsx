import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Breadcrumbs for the current location. Only the dashboard route is real in
 * this stage, so this is a static Home > Dashboard trail.
 */
export function AppBreadcrumb() {
  return (
    <Breadcrumb className="flex items-center gap-1 text-xs">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRightIcon aria-hidden="true" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
