import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Demo seed endpoint." });
}

export async function POST() {
  return NextResponse.json({ ok: true, message: "Demo seed endpoint." });
}
