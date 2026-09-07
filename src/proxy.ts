import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

// "/" doubles as the landing page: it shows the login form itself when
// signed out, so it must stay reachable without a session cookie.
const PUBLIC_PATHS = ["/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const userId = request.cookies.get(COOKIE_NAME)?.value;
  if (!userId) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
