import type { LucideIcon } from 'lucide-react'

/** A sellable item as rendered by the POS catalogue. */
export type Product = {
  id: string
  name: string
  category?: string
  price: number
  compareAtPrice?: number
  imageUrl?: string
  sku?: string
  /** `undefined` means stock is not tracked for this product. */
  stock?: number
  unit?: string
}

/** A single line in the cart / order summary. */
export type CartLine = {
  id: string
  name: string
  quantity: number
  unitPrice: number
  imageUrl?: string
  note?: string
}

/** A payment method option for the payment selector. */
export type PaymentMethodOption = {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
  disabled?: boolean
}

export type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'partially-paid'
  | 'completed'
  | 'refunded'
  | 'voided'

export type ReceiptLine = {
  id?: string
  name: string
  quantity: number
  unitPrice: number
}
