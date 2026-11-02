import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import type { Matcher } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DATE_FORMAT } from '@/lib/constants'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  /** Earliest selectable day. */
  fromDate?: Date
  /** Latest selectable day. */
  toDate?: Date
}

/**
 * Single-date picker composed from Popover + Calendar. Controlled through
 * `value` / `onChange`; the trigger is a regular button so it participates in
 * form tab order and accepts validation attributes.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  id,
  className,
  fromDate,
  toDate,
  ...ariaProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const matchers: Matcher[] = []
  if (fromDate) matchers.push({ before: fromDate })
  if (toDate) matchers.push({ after: toDate })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaProps['aria-invalid']}
          aria-describedby={ariaProps['aria-describedby']}
          className={cn(
            'w-full justify-start gap-2 px-3 text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
          {value ? format(value, DATE_FORMAT) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={matchers.length > 0 ? matchers : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
