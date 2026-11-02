import { SearchIcon, XIcon } from 'lucide-react'
import type { Ref } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari…',
  ariaLabel,
  className,
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  inputRef?: Ref<HTMLInputElement>
}) {
  return (
    <div className={cn('relative', className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        aria-label={ariaLabel ?? placeholder}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Hapus pencarian"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}
