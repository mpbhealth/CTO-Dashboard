// Example callback once you know the user ID (from your auth flow).
// Replace the "TODO" with your actual Supabase or NextAuth lookup.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("uid");
  // TODO: Look up the profile by userId to get role: 'cto' | 'ceo' | 'admin' | 'staff'
  // For example with Supabase (server-side): const { data: p } = await supabase.from('profiles').select('role').eq('id', userId).single();

  const role = url.searchParams.get("role") || "staff"; // TEMP: allow role in query until wired

  const res = NextResponse.redirect(new URL(role === "ceo" ? "/ceod/home" : "/ctod/home", req.url));
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}
