import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const res = NextResponse.json({ role: null, display_name: null });
    res.cookies.set("role", "", { path: "/", maxAge: 0 });
    res.cookies.set("display_name", "", { path: "/", maxAge: 0 });
    return res;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (profile?.role as string) || "staff";
  const displayName = profile?.display_name || null;

  const res = NextResponse.json({ role, display_name: displayName });
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });

  if (displayName) {
    res.cookies.set("display_name", displayName, { path: "/", sameSite: "lax" });
  }

  return res;
}
