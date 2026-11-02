"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"
import { cn } from "@/lib/utils"

export function AppHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => onToggle(!collapsed)}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>
      <div className={cn("flex items-center", collapsed ? "md:ml-0" : "")}>
        <AppBreadcrumb />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
