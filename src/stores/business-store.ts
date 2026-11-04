import { create } from 'zustand'
import { toast } from 'sonner'

import { createSeedData, BUSINESS_SETTINGS, type BusinessSeed } from '@/lib/business-seed'
import { isDemoMode } from '@/lib/auth-mode'
import { mutateBusiness } from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { BUSINESS_QUERY_KEY } from '@/hooks/use-business'
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

export type BusinessMode = 'demo' | 'real'

type BusinessState = BusinessSeed & {
  mode: BusinessMode
  ready: boolean
  hydrate: () => Promise<void>
  recordServerSale: (transaction: Transaction) => void

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

const DEMO_STORAGE_KEY = 'niraya.business.demo.v1'

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

async function sync(action: string, payload: unknown) {
  if (typeof window === 'undefined') return
  if (useBusinessStore.getState().mode !== 'real') return

  try {
    await mutateBusiness(action, payload)
    queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEY })
  } catch (error) {
    toast.error('Perubahan gagal disimpan', {
      description:
        error instanceof Error ? error.message : 'Silakan coba lagi.',
    })
    queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEY })
  }
}

/**
 * Business data store.
 *
 * - `demo` mode is the in-browser store used by the "Masuk mode demo" login.
 *   It is persisted to localStorage under `niraya.business.demo.v1`.
 * - `real` mode is hydrated from the database through `/api/business` and
 *   every mutation is synced back to the server.
 */
export const useBusinessStore = create<BusinessState>()((set, get) => ({
  ...createSeedData(),
  mode: 'demo',
  ready: false,

  hydrate: async () => {
    if (typeof window === 'undefined') return

    if (isDemoMode()) {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          set({ ...parsed, mode: 'demo', ready: true })
          return
        } catch {
          // fall through to a fresh seed
        }
      }

      set({ ...createSeedData(), mode: 'demo', ready: true })
      return
    }

    set({
      categories: [],
      products: [],
      customers: [],
      staff: [],
      transactions: [],
      movements: [],
      settings: BUSINESS_SETTINGS,
      mode: 'real',
      ready: false,
    })

    // Real data is fetched once by BusinessDataProvider via TanStack Query and
    // written into this store. This store no longer performs its own database
    // fetch so there is a single data source for real sessions.
    return
  },

  addCategory: (input) => {
    const category: Category = {
      id: uid('cat'),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      status: input.status ?? 'active',
      createdAt: nowIso(),
    }
    set((state) => ({ categories: [...state.categories, category] }))
    void sync('category.create', category)
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
    const updated = get().categories.find((category) => category.id === id)
    if (updated) void sync('category.update', updated)
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
    void sync('category.delete', { id })
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
    void sync('product.create', product)
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
    const updated = get().products.find((product) => product.id === id)
    if (updated) void sync('product.update', updated)
  },

  setProductStatus: (id, status) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, status } : product,
      ),
    }))
    void sync('product.status', { id, status })
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
    void sync('product.delete', { id })
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
    void sync('customer.create', customer)
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
    const updated = get().customers.find((customer) => customer.id === id)
    if (updated) void sync('customer.update', updated)
  },

  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((customer) => customer.id !== id),
    }))
    void sync('customer.delete', { id })
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
    void sync('staff.create', member)
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
    const updated = get().staff.find((member) => member.id === id)
    if (updated) void sync('staff.update', updated)
  },

  deleteStaff: (id) => {
    const member = get().staff.find((item) => item.id === id)
    if (member?.role === 'owner') {
      return { ok: false, reason: 'Akun owner tidak bisa dihapus.' }
    }
    set((state) => ({
      staff: state.staff.filter((item) => item.id !== id),
    }))
    void sync('staff.delete', { id })
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

    void sync('stock.adjust', {
      productId,
      mode,
      quantity,
      note: movement.note,
      staff,
      movementId: movement.id,
    })

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

  recordServerSale: (transaction) => {
    const state = get()
    const movements: StockMovement[] = []

    const products = state.products.map((product) => {
      const item = transaction.items.find(
        (entry) => entry.productId === product.id,
      )
      if (!item) return product

      const nextStock = Math.max(0, product.stock - item.quantity)
      movements.push({
        id: uid('mv'),
        productId: product.id,
        productName: product.name,
        type: 'sale',
        quantity: -item.quantity,
        stockAfter: nextStock,
        note: `Penjualan ${transaction.number}`,
        staff: transaction.cashier,
        createdAt: transaction.createdAt,
      })

      return { ...product, stock: nextStock }
    })

    set({
      products,
      transactions: [
        transaction,
        ...state.transactions.filter((item) => item.id !== transaction.id),
      ],
      movements: [...movements, ...state.movements],
    })
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

    void sync('transaction.void', { id, reason })
    return { ok: true }
  },

  updateSettings: (patch) => {
    set((state) => ({ settings: { ...state.settings, ...patch } }))
    void sync('settings.update', patch)
  },

  resetDemoData: () => {
    if (get().mode !== 'demo') return
    set(createSeedData())
  },
}))

if (typeof window !== 'undefined') {
  useBusinessStore.subscribe((state) => {
    if (state.mode !== 'demo' || !state.ready) return

    window.localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        categories: state.categories,
        products: state.products,
        customers: state.customers,
        staff: state.staff,
        transactions: state.transactions,
        movements: state.movements,
        settings: state.settings,
      }),
    )
  })
}
