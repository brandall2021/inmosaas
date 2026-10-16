import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth routing. Next.js 16 renamed Middleware to Proxy.
 *
 * This only checks for the presence of the session cookie — it does not touch
 * the database — so it stays fast on every request. Real verification happens
 * in the data access layer (`@/lib/dal`) close to the data.
 */

const protectedPrefixes = ["/dashboard"];
const authRoutes = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("session")?.value);

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authRoutes.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
