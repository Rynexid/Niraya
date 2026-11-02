import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, type BusinessSeed } from '@/lib/business-seed'
import type {
  BusinessSettings,
  Category,
  CompletedSale,
  Customer,
  EntityStatus,
  Product,
  Staff,
  StockMovement,
  Transaction,
} from '@/types/business'

export type ProductInput = {
  name: string
  sku: string
  barcode?: string
  categoryId: string
  price: number
  cost: number
  stock: number
  minStock: number
  unit: string
  imageUrl?: string
  status?: EntityStatus
}

export type CategoryInput = {
  name: string
  description?: string
  status?: EntityStatus
}

export type CustomerInput = {
  name: string
  phone: string
  email?: string
  notes?: string
}

export type StaffInput = {
  name: string
  email: string
  role: Staff['role']
  status: Staff['status']
}

export type StockMode = 'in' | 'out' | 'adjustment'

export type ActionResult = { ok: true } | { ok: false; reason: string }

type BusinessState = BusinessSeed & {
  addCategory: (input: CategoryInput) => Category
  updateCategory: (id: string, input: CategoryInput) => void
  deleteCategory: (id: string) => ActionResult

  addProduct: (input: ProductInput) => Product
  updateProduct: (id: string, input: ProductInput) => void
  setProductStatus: (id: string, status: EntityStatus) => void
  deleteProduct: (id: string) => ActionResult

  addCustomer: (input: CustomerInput) => Customer
  updateCustomer: (id: string, input: CustomerInput) => void
  deleteCustomer: (id: string) => void

  addStaff: (input: StaffInput) => Staff
  updateStaff: (id: string, input: StaffInput) => void
  deleteStaff: (id: string) => ActionResult

  adjustStock: (input: {
    productId: string
    mode: StockMode
    quantity: number
    note: string
    staff: string
  }) => ActionResult

  completeSale: (sale: CompletedSale) => Transaction
  voidTransaction: (id: string, reason: string) => ActionResult

  updateSettings: (patch: Partial<BusinessSettings>) => void
  resetDemoData: () => void
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const nowIso = () => new Date().toISOString()

const nextTransactionNumber = (transactions: Transaction[]) => {
  const highest = transactions.reduce((max, transaction) => {
    const match = /TRX-(\d+)/.exec(transaction.number)
    return match ? Math.max(max, Number(match[1])) : max
  }, 1000)

  return highest + 1
}

/**
 * In-browser demo store for the connected business modules.
 *
 * This is the single source of truth while the API is being built: POS sales
 * write transactions, decrement stock and append stock movements, so the
 * dashboard, transactions, inventory and reports all read the same records.
 * Persisted to `localStorage` under `niraya.business.v1`.
 */
export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      addCategory: (input) => {
        const category: Category = {
          id: uid('cat'),
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          status: input.status ?? 'active',
          createdAt: nowIso(),
        }
        set((state) => ({ categories: [...state.categories, category] }))
        return category
      },

      updateCategory: (id, input) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id
              ? {
                  ...category,
                  name: input.name.trim(),
                  description: input.description?.trim() || undefined,
                  status: input.status ?? category.status,
                }
              : category,
          ),
        }))
      },

      deleteCategory: (id) => {
        const used = get().products.some((product) => product.categoryId === id)
        if (used) {
          return {
            ok: false,
            reason: 'Kategori masih dipakai produk. Pindahkan produk dulu.',
          }
        }
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        }))
        return { ok: true }
      },

      addProduct: (input) => {
        const product: Product = {
          id: uid('prod'),
          name: input.name.trim(),
          sku: input.sku.trim().toUpperCase(),
          barcode: input.barcode?.trim() || undefined,
          categoryId: input.categoryId,
          price: input.price,
          cost: input.cost,
          stock: input.stock,
          minStock: input.minStock,
          unit: input.unit.trim() || 'pcs',
          imageUrl: input.imageUrl?.trim() || undefined,
          status: input.status ?? 'active',
          createdAt: nowIso(),
        }
        set((state) => ({ products: [product, ...state.products] }))
        return product
      },

      updateProduct: (id, input) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? {
                  ...product,
                  name: input.name.trim(),
                  sku: input.sku.trim().toUpperCase(),
                  barcode: input.barcode?.trim() || undefined,
                  categoryId: input.categoryId,
                  price: input.price,
                  cost: input.cost,
                  stock: input.stock,
                  minStock: input.minStock,
                  unit: input.unit.trim() || 'pcs',
                  imageUrl: input.imageUrl?.trim() || undefined,
                  status: input.status ?? product.status,
                }
              : product,
          ),
        }))
      },

      setProductStatus: (id, status) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, status } : product,
          ),
        }))
      },

      deleteProduct: (id) => {
        const used = get().transactions.some((transaction) =>
          transaction.items.some((item) => item.productId === id),
        )
        if (used) {
          return {
            ok: false,
            reason: 'Produk sudah dipakai transaksi. Arsipkan saja agar riwayat tetap utuh.',
          }
        }
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }))
        return { ok: true }
      },

      addCustomer: (input) => {
        const customer: Customer = {
          id: uid('cust'),
          name: input.name.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || undefined,
          notes: input.notes?.trim() || undefined,
          joinedAt: nowIso(),
        }
        set((state) => ({ customers: [customer, ...state.customers] }))
        return customer
      },

      updateCustomer: (id, input) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id
              ? {
                  ...customer,
                  name: input.name.trim(),
                  phone: input.phone.trim(),
                  email: input.email?.trim() || undefined,
                  notes: input.notes?.trim() || undefined,
                }
              : customer,
          ),
        }))
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }))
      },

      addStaff: (input) => {
        const member: Staff = {
          id: uid('staff'),
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          role: input.role,
          status: input.status,
          joinedAt: nowIso(),
          lastActive: nowIso(),
        }
        set((state) => ({ staff: [...state.staff, member] }))
        return member
      },

      updateStaff: (id, input) => {
        set((state) => ({
          staff: state.staff.map((member) =>
            member.id === id
              ? {
                  ...member,
                  name: input.name.trim(),
                  email: input.email.trim().toLowerCase(),
                  role: input.role,
                  status: input.status,
                }
              : member,
          ),
        }))
      },

      deleteStaff: (id) => {
        const member = get().staff.find((item) => item.id === id)
        if (member?.role === 'owner') {
          return { ok: false, reason: 'Akun owner tidak bisa dihapus.' }
        }
        set((state) => ({
          staff: state.staff.filter((item) => item.id !== id),
        }))
        return { ok: true }
      },

      adjustStock: ({ productId, mode, quantity, note, staff }) => {
        const product = get().products.find((item) => item.id === productId)
        if (!product) return { ok: false, reason: 'Produk tidak ditemukan.' }
        if (!Number.isFinite(quantity) || quantity < 0) {
          return { ok: false, reason: 'Jumlah stok tidak valid.' }
        }

        const delta =
          mode === 'in'
            ? quantity
            : mode === 'out'
              ? -quantity
              : quantity - product.stock

        const nextStock = product.stock + delta
        if (nextStock < 0) {
          return { ok: false, reason: 'Stok tidak boleh negatif.' }
        }

        const movement: StockMovement = {
          id: uid('mv'),
          productId: product.id,
          productName: product.name,
          type: mode,
          quantity: delta,
          stockAfter: nextStock,
          note: note.trim() || 'Penyesuaian stok',
          staff,
          createdAt: nowIso(),
        }

        set((state) => ({
          products: state.products.map((item) =>
            item.id === product.id ? { ...item, stock: nextStock } : item,
          ),
          movements: [movement, ...state.movements],
        }))

        return { ok: true }
      },

      completeSale: (sale) => {
        const state = get()
        const sequence = nextTransactionNumber(state.transactions)
        const candidate = sale.orderId.startsWith('TRX-')
          ? sale.orderId
          : `TRX-${sequence}`
        const number = state.transactions.some(
          (transaction) => transaction.number === candidate,
        )
          ? `TRX-${sequence}`
          : candidate
        const movements: StockMovement[] = []

        const products = state.products.map((product) => {
          const item = sale.items.find((entry) => entry.productId === product.id)
          if (!item) return product

          const nextStock = Math.max(0, product.stock - item.quantity)
          movements.push({
            id: uid('mv'),
            productId: product.id,
            productName: product.name,
            type: 'sale',
            quantity: -item.quantity,
            stockAfter: nextStock,
            note: `Penjualan ${sale.orderId}`,
            staff: sale.cashier,
            createdAt: sale.paidAt,
          })

          return { ...product, stock: nextStock }
        })

        const transaction: Transaction = {
          id: `trx-${number.slice(4)}`,
          number,
          createdAt: sale.paidAt,
          cashier: sale.cashier,
          customerId: sale.customerId,
          customerName: sale.customerName,
          orderType: sale.orderType,
          tableNumber: sale.tableNumber,
          items: sale.items,
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          cashReceived: sale.cashReceived,
          change: sale.change,
          status: 'completed',
        }

        set({
          products,
          transactions: [transaction, ...state.transactions],
          movements: [...movements, ...state.movements],
        })

        return transaction
      },

      voidTransaction: (id, reason) => {
        const state = get()
        const transaction = state.transactions.find((item) => item.id === id)
        if (!transaction) return { ok: false, reason: 'Transaksi tidak ditemukan.' }
        if (transaction.status !== 'completed') {
          return { ok: false, reason: 'Hanya transaksi selesai yang bisa dibatalkan.' }
        }

        const movements: StockMovement[] = []
        const products = state.products.map((product) => {
          const item = transaction.items.find(
            (entry) => entry.productId === product.id,
          )
          if (!item) return product

          const nextStock = product.stock + item.quantity
          movements.push({
            id: uid('mv'),
            productId: product.id,
            productName: product.name,
            type: 'void',
            quantity: item.quantity,
            stockAfter: nextStock,
            note: `Pembatalan ${transaction.number}`,
            staff: transaction.cashier,
            createdAt: nowIso(),
          })

          return { ...product, stock: nextStock }
        })

        set({
          products,
          movements: [...movements, ...state.movements],
          transactions: state.transactions.map((item) =>
            item.id === id
              ? { ...item, status: 'voided', voidReason: reason.trim() || 'Dibatalkan' }
              : item,
          ),
        })

        return { ok: true }
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }))
      },

      resetDemoData: () => {
        set(createSeedData())
      },
    }),
    {
      name: 'niraya.business.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        products: state.products,
        customers: state.customers,
        staff: state.staff,
        transactions: state.transactions,
        movements: state.movements,
        settings: state.settings,
      }),
    },
  ),
)
