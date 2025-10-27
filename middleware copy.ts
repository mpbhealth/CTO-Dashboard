import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const role = req.cookies.get("role")?.value || null;

  const publicPaths = ["/", "/login", "/api/auth/callback", "/api/session/refresh-role"];
  if (publicPaths.some(p => url.pathname.startsWith(p)) ||
      url.pathname.startsWith("/_next/") || url.pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (!role) return NextResponse.next();

  if (url.pathname.startsWith("/ctod") && !(role === "cto" || role === "admin")) {
    url.pathname = "/ceod/home"; return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith("/ceod") && !(role === "ceo" || role === "admin")) {
    url.pathname = "/ctod/home"; return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
