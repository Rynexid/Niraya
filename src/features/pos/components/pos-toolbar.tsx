"use client";

import type { Ref } from 'react'
import { BarcodeIcon, ScanLineIcon, SearchIcon, WalletIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PosToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  onOpenDrawer: () => void
  className?: string
}

/**
 * Page-level POS action bar: product search, scanner status and the cash
 * drawer shortcut. This is part of the terminal page, not the app shell.
 */
export function PosToolbar({
  search,
  onSearchChange,
  inputRef,
  onOpenDrawer,
  className,
}: PosToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center',
        className,
      )}
    >
      <div className="relative flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
          placeholder="Cari produk, SKU, atau barcode…"
          aria-keyshortcuts="Control+K Meta+K"
          className="h-10 rounded-lg pl-9 pr-20 text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            ⌘K
          </kbd>
          <BarcodeIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-success motion-safe:animate-pulse"
          />
          <ScanLineIcon aria-hidden="true" className="size-4" />
          <span className="hidden md:inline">Scanner Ready</span>
        </span>

        <Button
          type="button"
          variant="secondary"
          onClick={onOpenDrawer}
          className="h-10 gap-2 rounded-lg px-3 text-xs font-semibold"
        >
          <WalletIcon aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Buka Laci</span>
        </Button>
      </div>
    </div>
  )
}
