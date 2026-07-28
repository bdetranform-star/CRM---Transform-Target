import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Uses the edge-safe config directly (no Prisma/bcryptjs) since middleware
// runs in the Edge runtime, which neither supports.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  // External services (e.g. Instantly.ai) call this with a shared secret
  // instead of a session cookie — it authenticates itself, see the route handler.
  const isWebhookRoute = req.nextUrl.pathname.startsWith("/api/webhooks/");
  // Public by necessity: no session can exist yet before the first admin
  // account is created. The page/action guard themselves against reuse once
  // a user exists — see app/actions/setup.ts.
  const isSetupRoute = req.nextUrl.pathname.startsWith("/setup");

  if (isApiAuthRoute || isWebhookRoute || isSetupRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
