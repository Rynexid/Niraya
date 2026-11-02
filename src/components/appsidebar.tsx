"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  HelpCircle,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
} from "lucide-react"

import { NavUser } from "@/components/navuser"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  key: string
  title: string
  collapsible: boolean
  defaultOpen?: boolean
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    key: "overview",
    title: "Overview",
    collapsible: false,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    key: "sales",
    title: "Sales",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/pos", label: "POS Terminal", icon: ShoppingBag },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    key: "catalog",
    title: "Catalog",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Grid3X3 },
      { href: "/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    key: "business",
    title: "Business",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/staff", label: "Staff Management", icon: UserCog },
    ],
  },
  {
    key: "preferences",
    title: "Preferences",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/help", label: "Help & Support", icon: HelpCircle },
    ],
  },
]

const ALL_ITEMS = NAV.flatMap((group) => group.items)

export function AppSidebar({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean
  onToggle: (next: boolean) => void
  className?: string
}) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales: true,
    catalog: true,
    business: true,
    preferences: true,
  })

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))

  const brandContent = collapsed ? (
    <button
      onClick={() => onToggle(!collapsed)}
      className="group mx-auto mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-accent/50"
      title="Buka sidebar"
      aria-label="Buka sidebar"
    >
      <Logo size="sm" label={false} />
    </button>
  ) : (
    <button
      onClick={() => onToggle(!collapsed)}
      className="flex w-full shrink-0 items-center justify-between rounded-xl p-3 transition-colors duration-200 hover:bg-accent/50"
      aria-label="Tutup sidebar"
      title="Tutup sidebar"
    >
      <Logo size="md" />
    </button>
  )

  const navContent = collapsed ? (
    <>
      {ALL_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-xl transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" />
          </Link>
        )
      })}
    </>
  ) : (
    NAV.map((group) => {
      const groupOpen = group.collapsible ? !!openGroups[group.key] : true
      const header = (
        <div className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {group.title}
          {group.collapsible ? (
            groupOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )
          ) : null}
        </div>
      )

      return (
        <div key={group.key} className="space-y-1">
          {group.collapsible ? (
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full rounded-lg transition-colors hover:bg-accent/40"
              aria-expanded={groupOpen}
            >
              {header}
            </button>
          ) : (
            <div>{header}</div>
          )}
          {groupOpen ? (
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      )
    })
  )

  const footerContent = collapsed ? (
    <div className="flex justify-center">
      <NavUser
        collapsed
        user={{
          name: "Admin",
          email: "admin@niraya.app",
        }}
      />
    </div>
  ) : (
    <NavUser
      collapsed={false}
      user={{
        name: "Admin",
        email: "admin@niraya.app",
      }}
    />
  )

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-svh flex-col justify-between overflow-hidden",
        "transition-all duration-200 ease-in-out",
        className ? "" : "hidden md:flex",
        collapsed ? "w-[68px]" : "w-[260px]",
        className ?? "",
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm print:hidden"
      )}
      aria-label="Main navigation"
    >
      <div className="shrink-0 p-3">{brandContent}</div>

      <nav
        className={cn(
          "custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 text-sm",
          collapsed ? "flex flex-col items-center justify-start" : ""
        )}
      >
        {navContent}
      </nav>

      <footer className="shrink-0 border-t border-sidebar-border p-3">
        {footerContent}
      </footer>
    </aside>
  )
}
