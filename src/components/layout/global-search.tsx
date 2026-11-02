"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Global search input. No backend search exists yet, so submitting is a no-op.
 * Focus with Ctrl+K / ⌘K.
 */
export const GlobalSearch = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => inputRef.current!)

  return (
    <div className="relative w-full">
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Cari transaksi, produk…"
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          "h-control-sm w-full pl-8 pr-14 [&::-webkit-search-cancel-button]:hidden",
          className
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
          }
          if (event.key === "Escape") {
            event.currentTarget.blur()
          }
        }}
        {...props}
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground sm:flex">
        <span className="text-[11px]">⌘</span>K
      </kbd>
    </div>
  )
})

GlobalSearch.displayName = "GlobalSearch"
