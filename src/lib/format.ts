import { format } from 'date-fns'

import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
} from '@/lib/constants'

/**
 * Format a monetary value with the store locale. IDR has no minor unit, so it
 * is rendered without decimals; other currencies default to two.
 */
export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  const fractionDigits = currency === 'IDR' ? 0 : 2

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    ...options,
  }).format(value)
}

/** Format a plain number with thousands separators. */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value)
}

/** Format a date using the design-system defaults. */
export function formatDate(
  value: Date | string | number,
  pattern: string = DATE_FORMAT,
): string {
  return format(new Date(value), pattern)
}

/** Format a date and time using the design-system defaults. */
export function formatDateTime(value: Date | string | number): string {
  return formatDate(value, DATE_TIME_FORMAT)
}
