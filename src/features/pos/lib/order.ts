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
