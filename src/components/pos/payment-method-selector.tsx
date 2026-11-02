import { useId } from 'react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { PaymentMethodOption } from '@/types/pos'

type PaymentMethodSelectorProps = {
  methods: PaymentMethodOption[]
  value?: string
  onChange: (methodId: string) => void
  disabled?: boolean
  /** Accessible group name. */
  label?: string
  className?: string
}

/**
 * Accessible radio group styled as selectable rows. Radix handles arrow-key
 * navigation and roving focus.
 */
export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  disabled,
  label = 'Payment method',
  className,
}: PaymentMethodSelectorProps) {
  const groupId = useId()

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={cn('gap-2', className)}
    >
      {methods.map((method) => {
        const id = `${groupId}-${method.id}`
        const checked = value === method.id
        const Icon = method.icon

        return (
          <label
            key={method.id}
            htmlFor={id}
            data-disabled={method.disabled || disabled || undefined}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors',
              'hover:bg-muted/50',
              'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
              checked && 'border-primary/40 bg-primary/5 hover:bg-primary/5',
              (method.disabled || disabled) &&
                'cursor-not-allowed opacity-60 hover:bg-card',
            )}
          >
            <RadioGroupItem
              id={id}
              value={method.id}
              disabled={method.disabled}
              className="mt-0.5"
            />
            {Icon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                <Icon aria-hidden="true" className="size-4" />
              </span>
            ) : null}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{method.label}</span>
              {method.description ? (
                <span className="text-xs text-muted-foreground">
                  {method.description}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
