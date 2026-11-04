import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getBusinessData, mutateBusiness } from "@/server/business/service";

async function requireSession() {
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;
  return user;
}

export async function GET() {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getBusinessData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Business data error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    if (!action) {
      return NextResponse.json({ error: "Aksi wajib diisi." }, { status: 400 });
    }

    const result = await mutateBusiness(action, body?.payload ?? {});
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Business mutation error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan data." },
      { status: 400 }
    );
  }
}
