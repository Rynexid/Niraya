"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useBusinessStore } from '@/stores/business-store'
import { CartPanel } from '../components/cart-panel'
import { CheckoutDialog } from '../components/checkout-dialog'
import { CustomerPicker } from '../components/customer-picker'
import { ProductCatalog } from '../components/product-catalog'
import { PosToolbar } from '../components/pos-toolbar'
import { usePosCart } from '../hooks/use-pos-cart'
import { buildPosTotals } from '../lib/pricing'
import { createOrderId } from '../lib/order'
import type { PosOrderType } from '../lib/order'

export default function PosPage() {
  const router = useRouter()
  const products = useBusinessStore((state) => state.products)
  const categories = useBusinessStore((state) => state.categories)
  const customers = useBusinessStore((state) => state.customers)
  const settings = useBusinessStore((state) => state.settings)
  const completeSale = useBusinessStore((state) => state.completeSale)
  const cart = usePosCart(products)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [orderType, setOrderType] = useState<PosOrderType>('dine-in')
  const [tableNumber, setTableNumber] = useState('')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [memberApplied, setMemberApplied] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [orderId, setOrderId] = useState(() => createOrderId())
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault()
        setCheckoutOpen((open) => !open)
      }
      if (event.key === 'F9') {
        event.preventDefault()
        cart.clear()
        toast.success('Keranjang dikosongkan')
      }
      if (event.key === '/') {
        const target = event.target as HTMLElement | null
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
        if (target?.isContentEditable) return
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setCheckoutOpen(false)
        setCustomerPickerOpen(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart])

  const posProducts = useMemo(
    () =>
      products
        .filter((product) => product.status === 'active')
        .map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
        })),
    [products],
  )

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const customer of customers) {
      map.set(customer.id, customer.name)
    }
    return map
  }, [customers])

  const customerName = customerId ? customerMap.get(customerId) ?? 'Pelanggan umum' : 'Pelanggan umum'
  const selectedCustomer = customerId ? customers.find((customer) => customer.id === customerId) : undefined
  const memberEligible = Boolean(selectedCustomer)
  const effectiveMember = memberEligible && memberApplied

  const totals = useMemo(
    () =>
      buildPosTotals({
        subtotal: cart.subtotal,
        member: effectiveMember,
        memberDiscountRate: 0.1,
        taxRate: 0.1,
      }),
    [cart.subtotal, effectiveMember],
  )

  const quantityByProductId = useMemo(() => {
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

  const handleComplete = (sale: any) => {
    const transaction = completeSale(sale)
    cart.clear()
    setOrderId(createOrderId())
    setTableNumber('')
    setCustomerId(null)
    setMemberApplied(true)
    return transaction.number
  }

  return (
    <div className="h-[calc(100svh-4rem)] md:h-[calc(100svh-5rem)] flex flex-col overflow-hidden">
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="flex min-w-0 flex-col gap-2 lg:col-span-8 xl:col-span-9 min-h-0">
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
            categories={categories}
            activeCategoryId={categoryId}
            onCategoryChange={setCategoryId}
            quantityByProductId={quantityByProductId}
            onAdd={cart.add}
          />
        </section>
        <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 min-h-0">
          <CartPanel
            orderId={orderId}
            lines={cart.lines}
            itemCount={cart.itemCount}
            totals={totals}
            member={effectiveMember}
            memberEligible={memberEligible}
            memberDiscountRate={0.1}
            taxRate={0.1}
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
            className="w-full h-full"
          />
        </aside>
      </div>
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        orderId={orderId}
        lines={cart.lines}
        itemCount={cart.itemCount}
        totals={totals}
        orderType={orderType}
        tableNumber={tableNumber}
        customerId={customerId ?? undefined}
        customerName={customerName}
        cashierName="Kasir"
        settings={settings}
        onTableNumberChange={setTableNumber}
        onComplete={handleComplete}
      />
      <CustomerPicker
        open={customerPickerOpen}
        onOpenChange={setCustomerPickerOpen}
        customers={customers}
        selectedId={customerId}
        onSelect={handleSelectCustomer}
      />
    </div>
  )
}
