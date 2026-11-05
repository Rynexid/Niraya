import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID, diningTables, businessSettings } from "@/server/db/schema";
import { generateQrToken, hashQrToken } from "@/server/qr/token";

export type QrType = "TABLE" | "GENERAL";

function sanitizePublicTable(row: any) {
  return {
    qrType: row.qrType as QrType,
    tableNumber: row.qrType === "TABLE" ? row.tableNumber ?? null : null,
    name: row.name ?? null,
    isActive: !!row.isActive,
  };
}

export async function resolveQrToken(rawToken: string) {
  const hash = hashQrToken(rawToken);
  const [row] = await db.select().from(diningTables).where(eq(diningTables.qrTokenHash, hash)).limit(1);
  if (!row) return null;
  const [settings] = await db.select().from(businessSettings).where(eq(businessSettings.id, "default")).limit(1);
  if (!settings?.qrOrderingEnabled) return { ok: false as const, reason: "QR ordering disabled" };
  if (!row.isActive) return { ok: false as const, reason: "QR inactive" };
  return {
    ok: true as const,
    qr: sanitizePublicTable(row),
    diningTableId: row.qrType === "TABLE" ? String(row.id) : null,
    qrType: row.qrType as QrType,
  };
}

export async function listDiningTables() {
  return db.select({
    id: diningTables.id,
    tableNumber: diningTables.tableNumber,
    name: diningTables.name,
    qrType: diningTables.qrType,
    isActive: diningTables.isActive,
    createdAt: diningTables.createdAt,
    updatedAt: diningTables.updatedAt,
  }).from(diningTables).where(and(eq(diningTables.businessId, DEFAULT_BUSINESS_ID), eq(diningTables.storeId, DEFAULT_STORE_ID))).orderBy(sql`coalesce(${diningTables.tableNumber}, ${diningTables.name}, '') asc`);
}

export async function createTableQr(input: { tableNumber?: string; name?: string }) {
  const rawToken = generateQrToken();
  const [row] = await db.insert(diningTables).values({
    businessId: DEFAULT_BUSINESS_ID,
    storeId: DEFAULT_STORE_ID,
    tableNumber: input.tableNumber ?? null,
    name: input.name ?? null,
    qrType: "TABLE",
    qrTokenHash: hashQrToken(rawToken),
    isActive: true,
  }).returning();
  return { row: { id: row.id, tableNumber: row.tableNumber, name: row.name, qrType: row.qrType, isActive: row.isActive }, rawToken };
}

export async function ensureGeneralQr() {
  const [existing] = await db.select().from(diningTables)
    .where(and(eq(diningTables.storeId, DEFAULT_STORE_ID), sql`${diningTables.qrType} = 'GENERAL'`)).limit(1);
  if (existing) return { row: { id: existing.id, name: existing.name, qrType: existing.qrType, isActive: existing.isActive }, rawToken: null };
  const rawToken = generateQrToken();
  const [row] = await db.insert(diningTables).values({
    businessId: DEFAULT_BUSINESS_ID, storeId: DEFAULT_STORE_ID, name: "General Ordering", qrType: "GENERAL", qrTokenHash: hashQrToken(rawToken), isActive: true,
  }).returning();
  return { row: { id: row.id, name: row.name, qrType: row.qrType, isActive: row.isActive }, rawToken };
}

export async function regenerateQrToken(id: string) {
  const rawToken = generateQrToken();
  const [row] = await db.update(diningTables).set({ qrTokenHash: hashQrToken(rawToken), updatedAt: new Date() })
    .where(and(eq(diningTables.id, id), eq(diningTables.storeId, DEFAULT_STORE_ID))).returning();
  if (!row) return null;
  return { row: { id: row.id, tableNumber: row.tableNumber, name: row.name, qrType: row.qrType, isActive: row.isActive }, rawToken };
}

export async function updateDiningTable(id: string, patch: { tableNumber?: string | null; name?: string | null; isActive?: boolean }) {
  const [row] = await db.update(diningTables).set({ ...patch, updatedAt: new Date() } as any)
    .where(and(eq(diningTables.id, id), eq(diningTables.storeId, DEFAULT_STORE_ID))).returning();
  return row ? { id: row.id, tableNumber: row.tableNumber, name: row.name, qrType: row.qrType, isActive: row.isActive } : null;
}
