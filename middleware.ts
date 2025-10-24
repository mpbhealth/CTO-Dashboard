import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const role = req.cookies.get("role")?.value || null;

  const publicPaths = [
    "/",
    "/login",
    "/api/auth/callback",
    "/api/session/refresh-role"
  ];

  if (
    publicPaths.some((p) => url.pathname === p || url.pathname.startsWith(p)) ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.next();
  }

  if (url.pathname.startsWith("/ctod") && !(role === "cto" || role === "admin")) {
    if (role === "ceo") {
      return NextResponse.redirect(new URL("/ceod/home", req.url));
    } else if (role === "staff") {
      return NextResponse.redirect(new URL("/staff/home", req.url));
    }
  }

  if (url.pathname.startsWith("/ceod") && !(role === "ceo" || role === "admin")) {
    if (role === "cto") {
      return NextResponse.redirect(new URL("/ctod/home", req.url));
    } else if (role === "staff") {
      return NextResponse.redirect(new URL("/staff/home", req.url));
    }
  }

  if (url.pathname.startsWith("/staff") && role !== "staff" && role !== "admin") {
    if (role === "ceo") {
      return NextResponse.redirect(new URL("/ceod/home", req.url));
    } else if (role === "cto") {
      return NextResponse.redirect(new URL("/ctod/home", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
