import type { LucideIcon } from 'lucide-react'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type CategoryItemProps = {
  label: string
  icon?: LucideIcon
  count?: number
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const baseStyles =
  'inline-flex h-control-md items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * Category filter entry. Renders as a button when `onClick` is provided and as
 * static text otherwise, so it is never a focusable dead control.
 */
export function CategoryItem({
  label,
  icon: Icon,
  count,
  active = false,
  disabled,
  onClick,
  className,
}: CategoryItemProps) {
  const toneStyles = active
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'

  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      <span className="truncate">{label}</span>
      {typeof count === 'number' ? (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium tabular-nums',
            active ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          {formatNumber(count)}
        </span>
      ) : null}
    </>
  )

  if (!onClick) {
    return (
      <span
        data-active={active || undefined}
        className={cn(baseStyles, toneStyles, className)}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      data-active={active || undefined}
      className={cn(
        baseStyles,
        toneStyles,
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {content}
    </button>
  )
}
