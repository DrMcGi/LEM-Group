import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function POST() {
  return NextResponse.json(
    {
      error: "Use /api/admin/upload with kind=lease to upload lease agreements.",
    },
    { status: 400 },
  );
}
