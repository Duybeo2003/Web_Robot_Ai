import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminLandingPage, canAccessAdminPath } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { verifyActiveGuestOrderToken } from "@/lib/order-access";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimitSync(request: NextRequest): NextResponse | null {
  let ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  
  const WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS = 5000; // Increased significantly to prevent false positives behind reverse proxies
  const currentTime = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: currentTime });
  } else {
    if (currentTime - record.lastReset > WINDOW_MS) {
      rateLimitMap.set(ip, { count: 1, lastReset: currentTime });
    } else {
      record.count += 1;
      if (record.count > MAX_REQUESTS) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }
  }

  // Periodic cleanup + safety cap to prevent memory leak
  if (rateLimitMap.size > 10000 || Math.random() < 0.01) {
    const expiredTime = currentTime - WINDOW_MS;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.lastReset < expiredTime) {
        rateLimitMap.delete(key);
      }
    }
    // Hard cap: if still too large, clear entirely
    if (rateLimitMap.size > 10000) {
      rateLimitMap.clear();
    }
  }
  return null;
}

export default auth(async (req) => {
  const rlResponse = checkRateLimitSync(req);
  if (rlResponse) return rlResponse;

  const isAuth = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isAuthPage) {
    if (isAuth) {
      if (req.auth?.user?.role && req.auth.user.role !== "USER") {
        return NextResponse.redirect(
          new URL(adminLandingPage(req.auth.user.role), req.url),
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    // DO NOT redirect unauthenticated users away from /login, even if there's an error query param!
    return null;
  }

  const pathname = req.nextUrl.pathname;

  // Checkout success reads `notFound()` from a page nested under `loading.tsx`
  // (this one and the inherited root one), so the stream has already committed
  // a 200 by the time the page's own check runs. Gate access here instead,
  // before any streaming starts, so an invalid/expired guest token yields a
  // real 404 rather than a 200 with "not found" markup. Page keeps its own
  // check too — this is a pre-render gate, not the only line of defense.
  const checkoutSuccessMatch = pathname.match(/^\/checkout\/success\/([^/]+)$/);
  if (checkoutSuccessMatch) {
    const orderId = decodeURIComponent(checkoutSuccessMatch[1]);
    const token = req.nextUrl.searchParams.get("token");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, guestAccessTokenHash: true, guestAccessExpiresAt: true },
    });
    const canView = Boolean(
      order &&
        (isAuth
          ? order.userId === req.auth?.user?.id
          : token &&
            order.guestAccessTokenHash &&
            verifyActiveGuestOrderToken(
              token,
              order.guestAccessTokenHash,
              order.guestAccessExpiresAt,
            )),
    );
    if (!canView) {
      return NextResponse.rewrite(new URL("/__order_access_denied__", req.url));
    }
  }

  if (pathname.startsWith("/profile") && !isAuth) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("login", "true");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (!role || !canAccessAdminPath(role, pathname)) {
      return NextResponse.redirect(
        new URL(role ? adminLandingPage(role) : "/", req.url),
      );
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-roboeq-path", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });

});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
