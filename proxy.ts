import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "zeit_csp_session";
const AUTH_SECRET = process.env.AUTH_SECRET;

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Allow Next.js internals and public files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !AUTH_SECRET) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);

    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );

    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Run for application pages and API routes, excluding
     * Next.js static/image internals.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};