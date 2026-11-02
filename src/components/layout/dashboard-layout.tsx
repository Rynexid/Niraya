import { useState, useEffect, useRef } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, PanelLeftClose, PanelRightClose } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { GlobalSearch } from "@/components/layout/global-search"
import { NotificationDropdown } from "@/components/layout/notification-dropdown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const pageLabels: Record<string, string> = {
    dashboard: "Dashboard",
    pos: "POS Terminal",
    transactions: "Transaksi",
    products: "Produk",
    categories: "Kategori",
    inventory: "Inventori",
    customers: "Pelanggan",
    staff: "Staf",
    reports: "Laporan",
    settings: "Pengaturan",
    help: "Bantuan",
    profile: "Profil",
  }
  const segment = pathname.split("/")[1] ?? "dashboard"
  const currentPage = pageLabels[segment] ?? "Dashboard"

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const onChange = () => setIsMobile(window.innerWidth < 768)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < 768)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Ctrl+K / ⌘K focuses the global search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="flex h-svh">
      {/* Desktop sidebar (always visible on md+) */}
      <AppSidebar collapsed={collapsed} onToggle={setCollapsed} />

      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden print:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <AppSidebar
            collapsed={false}
            onToggle={() => {
              setCollapsed(true)
              setMobileSidebarOpen(false)
            }}
            className="absolute inset-y-0 left-0 z-50 w-[260px] md:hidden bg-sidebar border-r border-sidebar-border shadow-xl"
          />
        </>
      )}

      <div
        className={cn(
          "flex-1 flex h-svh flex-col relative",
          "transition-[margin-left] duration-200 ease-in-out",
          "bg-background print:ml-0 print:h-auto",
          collapsed ? "md:ml-[68px]" : "md:ml-[260px]"
        )}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen((o) => !o)}
              aria-label={mobileSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
                title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
                className="-ml-1"
              >
                {collapsed ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Niraya</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            {/* Global Search — langsung bersebelahan dengan notifikasi */}
            <div className="hidden md:flex w-44 lg:w-64 xl:w-72 mr-1">
              <GlobalSearch ref={searchRef} />
            </div>
            <NotificationDropdown />
            <ThemeToggle />
            {/* Avatar profile — klik langsung ke halaman akun (paling kanan) */}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center justify-between p-1 rounded-lg text-left transition-colors duration-200 hover:bg-accent"
              aria-label="Buka profil"
              title="Profil"
            >
              <Avatar className="size-8">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                  alt="Sarah Vance"
                />
                <AvatarFallback>SV</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
