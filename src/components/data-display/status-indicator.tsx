import { cn } from '@/lib/utils'

const toneStyles = {
  neutral: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
} as const

export type StatusTone = keyof typeof toneStyles

type StatusIndicatorProps = {
  tone?: StatusTone
  /** Visible label. Keep it short, e.g. "In stock". */
  label: string
  /** Adds a live pulse for realtime states. */
  pulse?: boolean
  size?: 'sm' | 'default'
  className?: string
}

/**
 * Small colored dot plus label, used for stock, sync and transaction states.
 * The label is always rendered as text so the state is not color-only.
 */
export function StatusIndicator({
  tone = 'neutral',
  label,
  pulse = false,
  size = 'default',
  className,
}: StatusIndicatorProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 text-muted-foreground',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        className,
      )}
    >
      <span aria-hidden="true" className="relative flex size-2 shrink-0">
        {pulse ? (
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              toneStyles[tone],
            )}
          />
        ) : null}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            toneStyles[tone],
          )}
        />
      </span>
      <span className="font-medium text-foreground/80">{label}</span>
    </span>
  )
}
