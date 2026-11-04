import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { ensureUserProfile, normalizeRole } from "@/server/auth/session";

/**
 * Mengembalikan akun yang sedang login beserta role aplikasinya.
 * Profil dibuat otomatis dengan role `user` jika belum ada.
 */
export async function GET() {
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureUserProfile(user);

  return NextResponse.json({
    user: {
      id: String(user.id),
      name: profile?.name ?? user.name ?? null,
      email: profile?.email ?? user.email ?? null,
      role: normalizeRole(profile?.role),
    },
  });
}
