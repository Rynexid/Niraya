import { Loader2Icon, type LucideIcon } from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ButtonSize = 'xs' | 'sm' | 'default' | 'lg'

const iconSizeMap = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  default: 'icon',
  lg: 'icon-lg',
} as const satisfies Record<ButtonSize, string>

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'size'
> & {
  /** Lucide icon rendered inside the button. */
  icon: LucideIcon
  /** Accessible name. Required because the button has no visible text. */
  label: string
  size?: ButtonSize
  iconClassName?: string
  /** Replaces the icon with a spinner and disables the button. */
  loading?: boolean
}

/**
 * Square, icon-only button. Always provide a `label`; it becomes the
 * accessible name and the native tooltip.
 */
export function IconButton({
  icon: Icon,
  label,
  size = 'default',
  variant = 'ghost',
  className,
  iconClassName,
  loading = false,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={iconSizeMap[size]}
      aria-label={label}
      title={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <Loader2Icon aria-hidden="true" className="animate-spin" />
      ) : (
        <Icon aria-hidden="true" className={cn(iconClassName)} />
      )}
    </Button>
  )
}
