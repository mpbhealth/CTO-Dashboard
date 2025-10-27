import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "ceo"|"cto"|"admin"|"staff" | null) || "staff";
  const res = NextResponse.redirect(new URL(role === "ceo" ? "/ceod/home" : "/ctod/home", req.url));
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  if (profile?.display_name) res.cookies.set("display_name", profile.display_name, { path: "/", sameSite: "lax" });
  return res;
}
