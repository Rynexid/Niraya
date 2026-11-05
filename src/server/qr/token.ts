import crypto from "crypto";

/** High-entropy public token for QR; raw token shown only on create/regenerate. */
export function generateQrToken(bytes = 32): string {
  // base64url, no padding; ~43 chars for 32 bytes.
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashQrToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

export function verifyQrToken(raw: string, expectedHash: string): boolean {
  const actual = hashQrToken(raw);
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}
