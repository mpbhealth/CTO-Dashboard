import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { role } = await req.json().catch(() => ({}));
  if (!role || !["cto","ceo","admin","staff"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}
