import { test, expect, mock } from "bun:test";

let _sessionUser: any = null;
let _role: any = "user";
mock.module("@/lib/auth", () => ({ getSession: async () => _sessionUser ? { user: _sessionUser } : null }));
mock.module("@/server/auth/session", () => ({
  requireRole: async (required: string) => {
    const rank: any = { user:0,cashier:1,manager:2,admin:3,owner:4 };
    if ((rank[_role]??-1) < (rank[required]??99)) { const e:any=new Error("Akses ditolak: role tidak cukup."); e.status=403; throw e; }
    return _role;
  },
  getCurrentUserRole: async () => _role,
  hasRole: (a:string,b:string)=>{const r:any={user:0,cashier:1,manager:2,admin:3,owner:4}; return (r[a]??-1)>=(r[b]??99);},
  ACTION_ROLES: {}, normalizeRole: (x:any)=>x||"user",
}));

import { GET as GetOrder } from "@/app/api/public/qr/orders/[orderId]/route";
import { POST as PostProof } from "@/app/api/public/qr/payments/proof/route";
import { POST as VerifyPayment } from "@/app/api/staff/qr/payments/verify/route";
import { GET as GetProof } from "@/app/api/staff/qr/payments/proof/route";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { orders, payments, guestOrderAccess, diningTables, products, inventory, businessSettings, checkoutIdempotency, customers } from "@/server/db/schema";
import { generateQrToken, hashQrToken } from "@/server/qr/token";
import { executeQrCheckout } from "@/server/qr/checkout";

const uid=(p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

async function setupGuestOrder() {
  await db.update(businessSettings).set({ qrOrderingEnabled:true, qrManualTransferEnabled:true, updatedAt:new Date() } as any).where(eq(businessSettings.id,"default"));
  const raw=generateQrToken();
  const [table]=await db.insert(diningTables).values({ businessId:"00000000-0000-0000-0000-000000000001", storeId:"00000000-0000-0000-0000-000000000002", name:"A8", tableNumber:uid("A8"), qrType:"TABLE", qrTokenHash:hashQrToken(raw), isActive:true }).returning();
  const pid=uid("a8p");
  await db.insert(products).values({ id:pid, businessId:"00000000-0000-0000-0000-000000000001", name:"A8", sku:`A8-${Date.now()}`, sellingPrice:"10000.00", costPrice:"4000.00", stockQuantity:5, minimumStock:0, unit:"pcs", status:"active", isStockTracked:true, createdAt:new Date(), updatedAt:new Date() } as any);
  await db.insert(inventory).values({ businessId:"00000000-0000-0000-0000-000000000001", storeId:"00000000-0000-0000-0000-000000000002", productId:pid, stockQuantity:5, reservedQuantity:0, minimumStock:0 } as any);
  const idem=uid("a8i");
  const res=await executeQrCheckout({ qrToken:raw, idempotencyKey:idem, items:[{productId:pid,quantity:1}], paymentMethod:"manual_transfer", customer:{mode:"guest",name:"G",phone:"08"} });
  return { res, table, pid, idem, guestToken: res._guestAccessRaw as string };
}
async function cleanup(x:any){ try{await db.delete(checkoutIdempotency).where(eq(checkoutIdempotency.key,x.idem));}catch{} try{if(x.res?.orderId)await db.delete(guestOrderAccess).where(eq(guestOrderAccess.orderId,x.res.orderId));}catch{} try{if(x.res?.orderId)await db.delete(orders).where(eq(orders.id,x.res.orderId));}catch{} try{await db.delete(inventory).where(eq(inventory.productId,x.pid));}catch{} try{await db.delete(products).where(eq(products.id,x.pid));}catch{} try{await db.delete(diningTables).where(eq(diningTables.id,x.table.id));}catch{} }

async function ensureCustomer(id:string, name:string){
  try { await db.insert(customers).values({ id, businessId:"00000000-0000-0000-0000-000000000001", name, phone:`08${id.slice(0,6)}`, createdAt:new Date(), updatedAt:new Date() } as any).onConflictDoNothing(); } catch {}
}

test("8G.8.1 guest token for Order A cannot access Order B (route)", async () => {
  _sessionUser=null; _role="user";
  const a=await setupGuestOrder(), b=await setupGuestOrder();
  try {
    const r = await GetOrder(new Request(`http://t/api/public/qr/orders/${b.res.orderId}`, { headers: { authorization: `Bearer ${a.guestToken}` } }), { params: Promise.resolve({ orderId: b.res.orderId }) });
    expect(r.status).toBe(403);
    const r2 = await GetOrder(new Request(`http://t/api/public/qr/orders/${a.res.orderId}`, { headers: { authorization: `Bearer ${a.guestToken}` } }), { params: Promise.resolve({ orderId: a.res.orderId }) });
    expect(r2.status).toBe(200);
  } finally { await cleanup(a); await cleanup(b); }
});

test("8G.8.1 authenticated customer A cannot access customer B order; missing session cannot access authenticated order", async () => {
  await ensureCustomer("custA","A"); await ensureCustomer("custB","B");
  _sessionUser={id:"custA",name:"A"}; _role="user";
  const a=await setupGuestOrder();
  try {
    await db.update(orders).set({ customerId:"custB" } as any).where(eq(orders.id,a.res.orderId));
    const r = await GetOrder(new Request(`http://t/api/public/qr/orders/${a.res.orderId}`), { params: Promise.resolve({ orderId: a.res.orderId }) });
    expect(r.status).toBe(403);
    _sessionUser=null;
    const r2 = await GetOrder(new Request(`http://t/api/public/qr/orders/${a.res.orderId}`), { params: Promise.resolve({ orderId: a.res.orderId }) });
    expect(r2.status).toBe(403);
  } finally { await cleanup(a); }
});

test("8G.8.1 unauthorized staff cannot verify payments or read private proof (route handlers)", async () => {
  _sessionUser={id:"staff-low"}; _role="cashier";
  const a=await setupGuestOrder();
  try {
    const v = await VerifyPayment(new Request("http://t/api/staff/qr/payments/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({paymentId:a.res.paymentId,action:"approve"})}));
    expect(v.status).toBe(403);
    const p = await GetProof(new Request(`http://t/api/staff/qr/payments/proof?paymentId=${a.res.paymentId}`));
    expect(p.status).toBe(403);
    _role="manager";
    const p2 = await GetProof(new Request(`http://t/api/staff/qr/payments/proof?paymentId=${a.res.paymentId}`));
    expect([404,200]).toContain(p2.status);
  } finally { _role="user"; await cleanup(a); }
});

test("8G.8.1 customer cannot upload proof for other customer's payment (route)", async () => {
  await ensureCustomer("custA","A"); await ensureCustomer("custB","B");
  _sessionUser={id:"custA"}; _role="user";
  const a=await setupGuestOrder();
  try {
    await db.update(orders).set({ customerId:"custB" } as any).where(eq(orders.id,a.res.orderId));
    const fd = new FormData(); fd.set("orderId",a.res.orderId); fd.set("paymentId",a.res.paymentId);
    fd.set("file", new File([new Uint8Array([0x89,0x50,0x4e,0x47,0,0,0,0,0,0,0,0,0])],"x.png",{type:"image/png"}));
    const r = await PostProof(new Request("http://t/api/public/qr/payments/proof",{method:"POST",body:fd, headers:{cookie:"a=b", origin:"http://t", host:"t"}}));
    expect(r.status).toBe(403);
  } finally { await cleanup(a); }
});
