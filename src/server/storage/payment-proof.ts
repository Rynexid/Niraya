import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/**
 * Payment proof storage boundary.
 * Default: local private dir under .data/payment-proofs (NOT publicly served).
 * Replace with S3-compatible object storage when configured.
 * NEVER use public bucket/URL for proofs.
 */
const ROOT = process.env.PAYMENT_PROOF_DIR || path.join(process.cwd(), ".data", "payment-proofs");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export type StoredProof = { key: string; contentType: string; size: number; sha256: string };

export async function storePaymentProof(input: {
  paymentId: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<StoredProof> {
  const ext = ALLOWED.get(input.contentType);
  if (!ext) throw Object.assign(new Error("Tipe file bukti tidak didukung."), { status: 400 });
  if (!input.bytes?.byteLength) throw Object.assign(new Error("File bukti kosong."), { status: 400 });
  if (input.bytes.byteLength > MAX_BYTES) throw Object.assign(new Error("Ukuran file bukti melebihi batas."), { status: 400 });
  const sha256 = crypto.createHash("sha256").update(input.bytes).digest("hex");
  const key = `${input.paymentId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const full = path.join(ROOT, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, input.bytes);
  return { key, contentType: input.contentType, size: input.bytes.byteLength, sha256 };
}

export async function readPaymentProof(key: string): Promise<{ bytes: Buffer; contentType?: string } | null> {
  // Basic path traversal guard.
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.resolve(ROOT, normalized);
  if (!full.startsWith(path.resolve(ROOT) + path.sep)) return null;
  try {
    const bytes = await fs.readFile(full);
    const ext = path.extname(full).slice(1).toLowerCase();
    const ct = [...ALLOWED.entries()].find(([, e]) => e === ext)?.[0];
    return { bytes, contentType: ct };
  } catch { return null; }
}
