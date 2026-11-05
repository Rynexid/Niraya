import { NextResponse } from "next/server";
import { expireReservations } from "@/server/qr/payments";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await expireReservations()); }
  catch (e:any) { return NextResponse.json({ error: e?.message || "Gagal." }, { status: 500 }); }
}
