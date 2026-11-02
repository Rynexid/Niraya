"use client"

import { ChevronsUpDown } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function NavUser({
  user,
  collapsed = false,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
  collapsed?: boolean
}) {
  const fallback = initials(user.name)

  if (collapsed) {
    return (
      <button
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        title={user.name}
        aria-label={user.name}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-medium">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </button>
    )
  }

  return (
    <button
      className={cn(
        "group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
    </button>
  )
}
