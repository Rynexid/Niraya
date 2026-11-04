"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"

export function AppHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className={collapsed ? "md:hidden" : undefined}
        onClick={() => onToggle(!collapsed)}
        aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>
      <div className="flex min-w-0 items-center">
        <AppBreadcrumb />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
