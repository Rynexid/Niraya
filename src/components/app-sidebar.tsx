import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
} from 'lucide-react'

import { NavUser } from '@/components/nav-user'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { isLowStock } from '@/lib/business-selectors'
import { DEMO_ACCOUNT } from '@/lib/demo-account'
import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/business-store'
import { useDemoAuthStore } from '@/stores/demo-auth-store'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
  dot?: boolean
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
    key: 'overview',
    title: 'Overview',
    collapsible: false,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    key: 'sales',
    title: 'Sales',
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: '/pos', label: 'POS Terminal', icon: ShoppingBag },
      { href: '/transactions', label: 'Transactions', icon: Receipt },
      { href: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    key: 'catalog',
    title: 'Catalog',
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: Grid3X3 },
      { href: '/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    key: 'business',
    title: 'Business',
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/staff', label: 'Staff Management', icon: UserCog },
    ],
  },
  {
    key: 'preferences',
    title: 'Preferences',
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/help', label: 'Help & Support', icon: HelpCircle },
    ],
  },
]

/** Every leaf navigation item (used for the collapsed icon-only stack). */
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
  const location = useLocation()
  const customers = useBusinessStore((state) => state.customers)
  const products = useBusinessStore((state) => state.products)
  const session = useDemoAuthStore((state) => state.session)
  const currentUser = session ?? DEMO_ACCOUNT

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales: true,
    catalog: true,
    business: true,
    preferences: true,
  })

  const lowStockCount = products.filter(isLowStock).length

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`)

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))

  const badgeFor = (item: NavItem) => {
    if (item.href === '/customers') return String(customers.length)
    return item.badge
  }

  const hasDot = (item: NavItem) =>
    item.dot || (item.href === '/inventory' && lowStockCount > 0)

  /* ---------- Brand / header ---------- */
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

  /* ---------- Navigation ---------- */
  const navContent = collapsed ? (
    <>
      {ALL_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            to={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              'relative flex size-11 items-center justify-center rounded-xl transition-colors duration-200',
              active
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-5 shrink-0" />
            {hasDot(item) ? (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-warning" />
            ) : null}
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
              type="button"
              onClick={() => toggleGroup(group.key)}
              aria-expanded={groupOpen}
              className="w-full rounded-md transition-colors duration-200 hover:bg-accent/60"
            >
              {header}
            </button>
          ) : (
            header
          )}

          {groupOpen ? (
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const badge = badgeFor(item)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {badge ? (
                      <span
                        className={cn(
                          'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]',
                          active
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'bg-accent text-accent-foreground',
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                    {hasDot(item) ? (
                      <span className="size-2 shrink-0 rounded-full bg-warning" />
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      )
    })
  )

  /* ---------- Footer / user ---------- */
  const footerContent = collapsed ? (
    <Link
      to="/profile"
      className="relative flex size-10 items-center justify-center rounded-full p-2 transition-transform hover:opacity-90"
      title={`${currentUser.name} • ${currentUser.role}`}
      aria-label={`Buka profil ${currentUser.name}`}
    >
      <Avatar className="size-9 rounded-full border border-sidebar">
        <AvatarFallback className="rounded-full text-xs font-semibold">
          {currentUser.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="absolute top-0 right-0 size-2.5 rounded-full border border-sidebar bg-success" />
    </Link>
  ) : (
    <NavUser
      user={{
        name: currentUser.name,
        email: currentUser.email,
        avatar: undefined,
      }}
    />
  )

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex h-svh flex-col justify-between overflow-hidden',
        'transition-all duration-200 ease-in-out',
        className ? '' : 'hidden md:flex',
        collapsed ? 'w-[68px]' : 'w-[260px]',
        className ?? '',
        'border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm print:hidden',
      )}
      aria-label="Main navigation"
    >
      <div className="shrink-0">{brandContent}</div>

      <nav
        className={cn(
          'custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 text-sm',
          collapsed ? 'flex flex-col items-center justify-start' : '',
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
