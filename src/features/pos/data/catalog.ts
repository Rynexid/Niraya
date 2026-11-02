import type { LucideIcon } from 'lucide-react'

import type { Product } from '@/types/pos'

/**
 * POS-facing catalog types. The data itself comes from the business store so
 * the terminal always matches the Products and Inventory modules.
 */

export type PosProduct = Product & {
  /** Category id used for filtering. `category` stays the display label. */
  categoryId: string
}

export type PosCategory = {
  id: string
  label: string
  icon: LucideIcon
  count: number
}
