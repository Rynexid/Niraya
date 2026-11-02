import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGridIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useBusinessStore } from '@/stores/business-store'
import { useDemoAuthStore } from '@/stores/demo-auth-store'
import type { CompletedSale } from '@/types/business'
import { CartPanel } from '../components/cart-panel'
import { CheckoutDialog } from '../components/checkout-dialog'
import { CustomerPickerDialog } from '../components/customer-picker-dialog'
import { PosToolbar } from '../components/pos-toolbar'
import { ProductCatalog } from '../components/product-catalog'
import type { PosCategory, PosProduct } from '../data/catalog'
import { usePosCart } from '../hooks/use-pos-cart'
import { categoryIcon } from '../lib/catalog-icons'
import type { PosOrderType } from '../lib/order'
import { computeTotals } from '../lib/pricing'

function createOrderId() {
  return `TRX-${Math.floor(1000 + Math.random() * 9000)}`
}

// Computed at module scope so the initial value stays pure during render.
const INITIAL_ORDER_ID = createOrderId()

/**
 * POS terminal. Reads the catalog and customers from the business store, and
 * writes completed sales back so stock, transactions and reports stay linked.
 */
export function PosPage() {
  const products = useBusinessStore((state) => state.products)
  const categories = useBusinessStore((state) => state.categories)
  const customers = useBusinessStore((state) => state.customers)
  const transactions = useBusinessStore((state) => state.transactions)
  const settings = useBusinessStore((state) => state.settings)
  const completeSale = useBusinessStore((state) => state.completeSale)
  const session = useDemoAuthStore((state) => state.session)
  const cashierName = session?.name ?? 'Kasir'

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [orderId, setOrderId] = useState(INITIAL_ORDER_ID)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [memberApplied, setMemberApplied] = useState(true)
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [orderType, setOrderType] = useState<PosOrderType>('dine-in')
  const [tableNumber, setTableNumber] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const posProducts = useMemo<PosProduct[]>(() => {
    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name]),
    )

    return products
      .filter((product) => product.status === 'active')
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: categoryNames.get(product.categoryId) ?? 'Tanpa kategori',
        categoryId: product.categoryId,
        price: product.price,
        stock: product.stock,
        sku: product.sku,
        imageUrl: product.imageUrl,
        unit: product.unit,
      }))
  }, [products, categories])

  const posCategories = useMemo<PosCategory[]>(() => {
    const activeCategories = categories.filter(
      (category) => category.status === 'active',
    )

    return [
      {
        id: 'all',
        label: 'Semua Menu',
        icon: LayoutGridIcon,
        count: posProducts.length,
      },
      ...activeCategories.map((category) => ({
        id: category.id,
        label: category.name,
        icon: categoryIcon(category.name),
        count: posProducts.filter(
          (product) => product.categoryId === category.id,
        ).length,
      })),
    ]
  }, [categories, posProducts])

  const cart = usePosCart(posProducts)

  const selectedCustomer =
    customers.find((customer) => customer.id === customerId) ?? null
  const customerName = selectedCustomer?.name ?? 'Walk-in Customer'
  const memberEligible = selectedCustomer !== null
  const member = memberEligible && memberApplied

  const totals = useMemo(
    () =>
      computeTotals(cart.subtotal, member, {
        taxRate: settings.taxRate,
        memberDiscountRate: settings.memberDiscountRate,
      }),
    [cart.subtotal, member, settings.taxRate, settings.memberDiscountRate],
  )

  // Ctrl+K / ⌘K focuses the product search.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // F12 opens the checkout dialog, matching the hardware shortcut.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F12' && cart.itemCount > 0) {
        event.preventDefault()
        setCheckoutOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cart.itemCount])

  const quantities = useMemo(() => {
    const map: Record<string, number> = {}
    for (const line of cart.lines) {
      map[line.product.id] = line.quantity
    }
    return map
  }, [cart.lines])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return posProducts.filter((product) => {
      const matchesCategory =
        categoryId === 'all' || product.categoryId === categoryId
      const matchesQuery =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        (product.sku ?? '').toLowerCase().includes(query)

      return matchesCategory && matchesQuery
    })
  }, [posProducts, search, categoryId])

  const handleSelectCustomer = (nextCustomerId: string | null) => {
    setCustomerId(nextCustomerId)
    setMemberApplied(true)
  }

  const handleComplete = (sale: CompletedSale) => {
    const transaction = completeSale(sale)
    cart.clear()
    setOrderId(createOrderId())
    setTableNumber('')
    setCustomerId(null)
    setMemberApplied(true)
    return transaction.number
  }

  return (
    <div className="flex min-h-full flex-col xl:h-full xl:min-h-0">
      <div className="grid flex-1 grid-cols-1 gap-4 xl:min-h-0 xl:grid-cols-12">
        <section className="flex min-w-0 flex-col gap-3 xl:col-span-8 xl:min-h-0">
          <PosToolbar
            search={search}
            onSearchChange={setSearch}
            inputRef={searchRef}
            onOpenDrawer={() =>
              toast('Laci kasir dibuka', {
                description: 'Simulasi perangkat — belum tersambung.',
              })
            }
          />
          <ProductCatalog
            products={filteredProducts}
            categories={posCategories}
            quantities={quantities}
            activeCategory={categoryId}
            onCategoryChange={setCategoryId}
            onAdd={cart.add}
            className="xl:min-h-0 xl:flex-1"
          />
        </section>

        <CartPanel
          orderId={orderId}
          lines={cart.lines}
          itemCount={cart.itemCount}
          totals={totals}
          member={member}
          memberEligible={memberEligible}
          memberDiscountRate={settings.memberDiscountRate}
          taxRate={settings.taxRate}
          onToggleMember={() => setMemberApplied((value) => !value)}
          customerName={customerName}
          onOpenCustomerPicker={() => setCustomerPickerOpen(true)}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          tableNumber={tableNumber}
          onTableNumberChange={setTableNumber}
          onIncrement={cart.increment}
          onDecrement={cart.decrement}
          onRemove={cart.remove}
          onClear={cart.clear}
          onCheckout={() => setCheckoutOpen(true)}
          className="xl:col-span-4 xl:min-h-0"
        />
      </div>

      <CustomerPickerDialog
        open={customerPickerOpen}
        onOpenChange={setCustomerPickerOpen}
        customers={customers}
        transactions={transactions}
        selectedId={selectedCustomer?.id ?? null}
        memberDiscountRate={settings.memberDiscountRate}
        onSelect={handleSelectCustomer}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        orderId={orderId}
        lines={cart.lines}
        itemCount={cart.itemCount}
        totals={totals}
        orderType={orderType}
        tableNumber={tableNumber}
        customerId={selectedCustomer?.id}
        customerName={customerName}
        cashierName={cashierName}
        settings={settings}
        onTableNumberChange={setTableNumber}
        onComplete={handleComplete}
      />
    </div>
  )
}
