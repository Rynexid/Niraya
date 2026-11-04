"use client"

import { Fragment, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  const items = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)

    if (segments.length === 0) return []

    const items = segments.map((segment, index) => ({
      href: "/" + segments.slice(0, index + 1).join("/"),
      isLast: index === segments.length - 1,
      label: formatLabel(segment),
    }))

    if (segments[0] !== "dashboard") {
      items.unshift({ href: "/dashboard", isLast: false, label: "Dashboard" })
    }

    return items
  }, [pathname])

  if (items.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href} />}>
                  {item.label}
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
