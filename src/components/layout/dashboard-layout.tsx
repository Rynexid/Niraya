"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/appsidebar"
import { AppHeader } from "@/components/layout/app-header"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar collapsed={collapsed} onToggle={setCollapsed} />
      <div
        className={cn(
          "flex min-h-svh flex-col transition-all duration-200",
          collapsed ? "md:pl-[68px]" : "md:pl-[260px]"
        )}
      >
        <AppHeader collapsed={collapsed} onToggle={setCollapsed} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
