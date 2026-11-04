/** How the order will be served — affects table-number capture and receipts. */
export type PosOrderType = 'dine-in' | 'takeaway'

export const ORDER_TYPE_LABELS: Record<PosOrderType, string> = {
  'dine-in': 'Dine in',
  takeaway: 'Takeaway',
}

/** Keep table numbers short and numeric. */
export function sanitizeTableNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3)
}


export function createOrderId() {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${y}${m}${d}-${rand}`
}
