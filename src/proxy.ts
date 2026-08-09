import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimitSync(request: NextRequest): NextResponse | null {
  let ip = request.headers.get("x-forwarded-for") ?? request.ip ?? "127.0.0.1";
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

export default auth((req) => {
  const rlResponse = checkRateLimitSync(req);
  if (rlResponse) return rlResponse;

  const isAuth = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isAuthPage) {
    if (isAuth) {
      if (req.auth?.user?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    // DO NOT redirect unauthenticated users away from /login, even if there's an error query param!
    return null;
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect user portal routes
  if (req.nextUrl.pathname.startsWith("/portal")) {
    if (!isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
