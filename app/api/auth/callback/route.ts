import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
  }

  const role = (profile?.role as "ceo" | "cto" | "admin" | "staff" | null) || "staff";

  let redirectPath = "/ctod/home";
  if (role === "ceo") {
    redirectPath = "/ceod/home";
  } else if (role === "staff") {
    redirectPath = "/staff/home";
  }

  const res = NextResponse.redirect(new URL(redirectPath, req.url));
  res.cookies.set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });

  if (profile?.display_name) {
    res.cookies.set("display_name", profile.display_name, { path: "/", sameSite: "lax" });
  }

  return res;
}
