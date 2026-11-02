import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type FilterOption = {
  value: string
  label: string
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Semua',
  ariaLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly FilterOption[]
  placeholder?: string
  ariaLabel?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn('h-9 w-full sm:w-[168px]', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
