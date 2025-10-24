import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getRole(req: NextRequest): string | null {
  const cookie = req.cookies.get("role")?.value || null;
  return cookie;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const role = getRole(req);

  // If no role cookie yet, let the request pass (login or public routes should set it)
  if (!role) return NextResponse.next();

  if (url.pathname.startsWith("/ctod") && !(role === "cto" || role === "admin")) {
    url.pathname = "/ceod/home";
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith("/ceod") && !(role === "ceo" || role === "admin")) {
    url.pathname = "/ctod/home";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"] };
