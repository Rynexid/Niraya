import type {
  OrderType,
  PaymentMethod,
  StaffRole,
  StockMovementType,
  TransactionStatus,
} from '@/types/business'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  card: 'EDC',
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  'dine-in': 'Dine in',
  takeaway: 'Takeaway',
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  completed: 'Selesai',
  voided: 'Dibatalkan',
  refunded: 'Refund',
}

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  in: 'Stok masuk',
  out: 'Stok keluar',
  adjustment: 'Penyesuaian',
  sale: 'Penjualan',
  void: 'Pembatalan',
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Kasir',
}

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner: 'Akses penuh, termasuk pengaturan bisnis dan laporan.',
  admin: 'Mengelola katalog, staf, dan operasional harian.',
  manager: 'Memantau penjualan, stok, dan kinerja tim.',
  cashier: 'Memproses penjualan dan pembayaran di POS.',
}

export const CASHIER_NAME = 'Sarah Vance'
