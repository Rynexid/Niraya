import crypto from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  DEFAULT_BUSINESS_ID,
  DEFAULT_STORE_ID,
  businessSettings,
  categories,
  checkoutIdempotency,
  diningTables,
  inventory,
  inventoryReservations,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  products,
  productVariants,
  taxRates,
} from "@/server/db/schema";
import { hashQrToken } from "@/server/qr/token";

export type QrCheckoutInput = {
  qrToken: string;
  idempotencyKey: string;
  items: { productId: string; variantId?: string | null; quantity: number; notes?: string }[];
  paymentMethod: "manual_transfer";
  orderType?: "dine-in" | "takeaway";
  notes?: string;
  customer: { mode: "guest" | "authenticated"; name: string; phone: string; email?: string | null; customerId?: string | null };
};

function roundMoney(v: number) { return Math.round((v + Number.EPSILON) * 100) / 100; }
function generateOrderNumber() {
  const d = new Date(); const y = d.getFullYear().toString().slice(-2); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0");
  return `QR-${y}${m}${day}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}
export function hashQrRequest(input: QrCheckoutInput) {
  const items = [...input.items].sort((a,b)=> (a.productId+(a.variantId||'')).localeCompare(b.productId+(b.variantId||'')));
  return crypto.createHash("sha256").update(JSON.stringify({
    qrTokenHash: hashQrToken(input.qrToken), items, paymentMethod: input.paymentMethod, orderType: input.orderType,
    notes: input.notes, customer: { mode: input.customer.mode, name: input.customer.name, phone: input.customer.phone, email: input.customer.email ?? null },
  })).digest("hex");
}

export async function getPublicCatalog() {
  const [settings] = await db.select().from(businessSettings).where(eq(businessSettings.id, "default")).limit(1);
  if (!settings?.qrOrderingEnabled) throw Object.assign(new Error("QR ordering tidak aktif."), { status: 403 });
  const cats = await db.select({ id: categories.id, name: categories.name, sortOrder: categories.sortOrder })
    .from(categories).where(and(eq(categories.businessId, DEFAULT_BUSINESS_ID), eq(categories.status, "active"), sql`${categories.deletedAt} is null`));
  const prods = await db.select({
    id: products.id, name: products.name, description: products.description, categoryId: products.categoryId, sellingPrice: products.sellingPrice, imageUrl: products.imageUrl, isTaxable: products.isTaxable, isStockTracked: products.isStockTracked, stockQuantity: products.stockQuantity,
  }).from(products).where(and(eq(products.businessId, DEFAULT_BUSINESS_ID), eq(products.status, "active"), sql`${products.deletedAt} is null`));
  const ids = prods.map(p=>p.id);
  const vars = ids.length ? await db.select({ id: productVariants.id, productId: productVariants.productId, name: productVariants.name, sellingPrice: productVariants.sellingPrice, isActive: productVariants.isActive }).from(productVariants).where(and(eq(productVariants.businessId, DEFAULT_BUSINESS_ID), inArray(productVariants.productId, ids))) : [];
  const varsBy = new Map<string, any[]>(); for (const v of vars.filter(v=>v.isActive)) { const a=varsBy.get(v.productId)??[]; a.push({id:v.id,name:v.name,sellingPrice:v.sellingPrice?Number(v.sellingPrice):null}); varsBy.set(v.productId,a); }
  return {
    categories: cats.sort((a,b)=>(a.sortOrder-b.sortOrder)||a.name.localeCompare(b.name)),
    products: prods.map(p=>({ id:p.id,name:p.name,description:p.description,categoryId:p.categoryId,sellingPrice:Number(p.sellingPrice),imageUrl:p.imageUrl,isTaxable:!!p.isTaxable,available: !p.isStockTracked || p.stockQuantity>0, variants: varsBy.get(p.id)??[] })),
  };
}

export async function executeQrCheckout(input: QrCheckoutInput) {
  if (input.paymentMethod !== "manual_transfer") throw Object.assign(new Error("Metode pembayaran QR tidak didukung pada fase ini."), { status: 400 });
  if (!input.customer.name?.trim() || !input.customer.phone?.trim()) throw Object.assign(new Error("Nama dan nomor telepon wajib diisi."), { status: 400 });
  if (input.customer.mode === "authenticated" && !input.customer.customerId) throw Object.assign(new Error("Sesi pelanggan tidak valid."), { status: 401 });
  const requestHash = hashQrRequest(input);
  const canonicalItems = [...input.items].sort((a,b)=> (a.productId+(a.variantId||'')).localeCompare(b.productId+(b.variantId||'')));
  const productIds = [...new Set(canonicalItems.map(i=>i.productId))].sort();

  return db.transaction(async (tx: any) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`qr:${input.idempotencyKey}`}))`);
    const [existing] = await tx.select().from(checkoutIdempotency).where(eq(checkoutIdempotency.key, input.idempotencyKey)).limit(1);
    if (existing) {
      if (existing.requestHash !== requestHash) throw Object.assign(new Error("Idempotency key dipakai dengan payload berbeda."), { status: 409 });
      if (existing.response) return JSON.parse(existing.response);
    }
    const [settings] = await tx.select().from(businessSettings).where(eq(businessSettings.id,"default")).limit(1);
    if (!settings?.qrOrderingEnabled) throw Object.assign(new Error("QR ordering tidak aktif."), { status: 403 });
    if (!settings?.qrManualTransferEnabled) throw Object.assign(new Error("Pembayaran transfer manual belum diaktifkan."), { status: 403 });

    const qrHash = hashQrToken(input.qrToken);
    const [qrRow] = await tx.select().from(diningTables).where(eq(diningTables.qrTokenHash, qrHash)).limit(1);
    if (!qrRow || !qrRow.isActive) throw Object.assign(new Error("QR tidak valid atau tidak aktif."), { status: 404 });
    const qrType = String(qrRow.qrType) as "TABLE"|"GENERAL";
    const orderSource = qrType === "GENERAL" ? "QR_GENERAL" : "QR_TABLE";
    const diningTableId = qrType === "TABLE" ? String(qrRow.id) : null;
    const tableNumber = qrType === "TABLE" ? (qrRow.tableNumber || qrRow.name || null) : null;

    const productRows = await tx.select().from(products).where(inArray(products.id, productIds)).orderBy(products.id).for("update");
    const invRows = await tx.select().from(inventory).where(and(eq(inventory.storeId, DEFAULT_STORE_ID), inArray(inventory.productId, productIds))).orderBy(inventory.productId).for("update");
    const varIds = canonicalItems.map(i=>i.variantId).filter(Boolean) as string[];
    const varRows = varIds.length ? await tx.select().from(productVariants).where(inArray(productVariants.id, varIds)) : [];
    const pBy = new Map(productRows.map((r:any)=>[r.id,r])); const iBy = new Map(invRows.map((r:any)=>[r.productId,r])); const vBy = new Map(varRows.map((r:any)=>[r.id,r]));
    const [defaultTaxRate] = await tx.select().from(taxRates).where(and(eq(taxRates.businessId,DEFAULT_BUSINESS_ID), eq(taxRates.isDefault,true))).limit(1);
    const taxRate = settings ? Number(settings.taxRate) : Number(defaultTaxRate?.rate ?? 0);

    let subtotal = 0; const items: any[] = [];
    for (const it of canonicalItems) {
      const p = pBy.get(it.productId) as any; if (!p) throw Object.assign(new Error(`Produk ${it.productId} tidak ditemukan.`),{status:400});
      if (p.status !== "active") throw Object.assign(new Error(`Produk ${p.name} tidak tersedia.`),{status:400});
      if (it.variantId) { const v=vBy.get(it.variantId) as any; if (!v || v.productId!==p.id || !v.isActive) throw Object.assign(new Error(`Varian tidak valid.`),{status:400}); }
      const inv = iBy.get(it.productId) as any; const onHand = inv?.stockQuantity ?? p.stockQuantity ?? 0; const reserved = inv?.reservedQuantity ?? 0; const available = Math.max(0, onHand - reserved);
      if ((p.isStockTracked ?? true) && available < it.quantity) throw Object.assign(new Error(`Stok ${p.name} tidak cukup.`),{status:409});
      const variant = it.variantId ? vBy.get(it.variantId) as any : null;
      const unit = Number(variant?.sellingPrice ?? p.sellingPrice); const line = roundMoney(unit * it.quantity); subtotal += line;
      items.push({ productId:p.id, variantId: it.variantId||null, productName:p.name, sku:p.sku, variantName: variant?.name??null, quantity:it.quantity, unitPrice:unit, lineTotal:line, notes: it.notes||null, product:p, inv });
    }
    subtotal = roundMoney(subtotal); const tax = roundMoney(subtotal * taxRate); const total = roundMoney(subtotal + tax);
    const now = new Date(); const expiryMin = Math.max(5, Number(settings.reservationExpiryMinutes || 30));
    const expiresAt = new Date(now.getTime() + expiryMin*60000);
    const orderId = crypto.randomUUID(); const orderNumber = generateOrderNumber();
    const paymentId = crypto.randomUUID();

    await tx.insert(orders).values({
      id: orderId, businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, orderNumber, orderSource, orderStatus: "SUBMITTED", paymentStatus: "PENDING",
      diningTableId, customerId: input.customer.mode==="authenticated" ? (input.customer.customerId ?? null) : null,
      customerName: input.customer.name.trim(), customerPhone: input.customer.phone.trim(), orderType: input.orderType || (qrType==="TABLE"?"dine-in":"takeaway"),
      tableNumber, paymentMethod: "manual_transfer", currency:"IDR", subtotal: subtotal.toFixed(2), discountTotal:"0.00", taxTotal: tax.toFixed(2), grandTotal: total.toFixed(2),
      idempotencyKey: input.idempotencyKey, notes: input.notes||null, submittedAt: now, createdAt: now, updatedAt: now,
    } as any);

    for (const it of items) {
      const orderItemId = crypto.randomUUID();
      await tx.insert(orderItems).values({ id: orderItemId, orderId, productId: it.productId, productVariantId: it.variantId, productName: it.productName, sku: it.sku, variantName: it.variantName, quantity: it.quantity, unitPrice: it.unitPrice.toFixed(2), discountTotal:"0.00", taxTotal:"0.00", subtotal: it.lineTotal.toFixed(2), notes: it.notes, createdAt: now } as any);
      if (it.product.isStockTracked ?? true) {
        await tx.insert(inventoryReservations).values({ id: crypto.randomUUID(), businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, orderId, orderItemId, productId: it.productId, quantity: it.quantity, status: "RESERVED", expiresAt, createdAt: now, updatedAt: now } as any);
        const inv = it.inv; const nextReserved = (inv?.reservedQuantity ?? 0) + it.quantity;
        if (inv) await tx.update(inventory).set({ reservedQuantity: nextReserved, updatedAt: now }).where(eq(inventory.id, inv.id));
        else await tx.insert(inventory).values({ businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, productId: it.productId, stockQuantity: it.product.stockQuantity ?? 0, reservedQuantity: nextReserved, minimumStock: it.product.minimumStock ?? 0, updatedAt: now } as any);
      }
    }

    await tx.insert(payments).values({
      id: paymentId, transactionId: null, orderId, channel: "QR", currency:"IDR", paymentMethod:"manual_transfer", amount: total.toFixed(2), status:"PENDING", expiresAt, metadata: { source: orderSource }, createdAt: now,
    } as any);
    await tx.insert(orderStatusHistory).values({ orderId, fromOrderStatus:null, toOrderStatus:"SUBMITTED", fromPaymentStatus:null, toPaymentStatus:"PENDING", changedByUserId: input.customer.mode==="authenticated"? (input.customer.customerId ?? null):null, changedByRole: input.customer.mode==="authenticated"?"customer":"guest", reason:"QR checkout submitted; awaiting manual transfer", createdAt: now } as any);

    const response = {
      orderId, orderNumber, orderSource, orderStatus:"SUBMITTED", paymentStatus:"PENDING", paymentId,
      qr: { type: qrType, tableNumber },
      customer: { mode: input.customer.mode, name: input.customer.name.trim(), phone: input.customer.phone.trim() },
      items: items.map((i:any)=>({productId:i.productId,productName:i.productName,variantName:i.variantName,quantity:i.quantity,unitPrice:i.unitPrice,lineTotal:i.lineTotal})),
      totals: { subtotal, tax, total, currency:"IDR" },
      reservation: { expiresAt: expiresAt.toISOString() },
      payment: { method:"manual_transfer", status:"PENDING", instructions: { bankName: settings.manualTransferBankName, accountName: settings.manualTransferAccountName, accountNumber: settings.manualTransferAccountNumber, instructions: settings.manualTransferInstructions } },
    };
    await tx.insert(checkoutIdempotency).values({ key: input.idempotencyKey, requestHash, transactionId: null, orderId, scope:"QR", response: JSON.stringify(response), createdAt: now, expiresAt } as any)
      .onConflictDoUpdate({ target: checkoutIdempotency.key, set: { orderId, scope:"QR", response: JSON.stringify(response) } as any });
    return response;
  });
}
