import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const res = NextResponse.json({ role: null });
    res.cookies.set("role", "", { path: "/", maxAge: 0 });
    return res;
  }
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).single();
  const role = (profile?.role as string) || "staff";
  const res = NextResponse.json({ role, display_name: profile?.display_name || null });
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  if (profile?.display_name) res.cookies.set("display_name", profile.display_name, { path: "/", sameSite: "lax" });
  return res;
}
