"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment, useMemo } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  pos: "POS Terminal",
  transactions: "Transaksi",
  products: "Produk",
  categories: "Kategori",
  inventory: "Inventori",
  customers: "Pelanggan",
  staff: "Manajemen Staf",
  reports: "Laporan",
  settings: "Pengaturan",
  help: "Bantuan & Dukungan",
  profile: "Profil",
  add: "Tambah",
  edit: "Edit",
  detail: "Detail",
}

function formatLabel(segment: string) {
  if (labels[segment]) return labels[segment]
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detail"
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname])

  if (segments.length === 0) return null

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isLast = index === segments.length - 1
    const label = formatLabel(segment)
    return { segment, href, isLast, label }
  })

  const shouldCollapse = items.length > 3
  if (shouldCollapse) {
    const first = items[0]
    const last = items[items.length - 1]
    const middle = items.slice(1, items.length - 1)
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={first.href}>{first.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <BreadcrumbEllipsis />
                  <span className="sr-only">Tampilkan breadcrumb</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {middle.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{last.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
