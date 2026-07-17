import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register")

  if (isAuthPage) {
    if (isAuth) {
      if (req.auth?.user?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/", req.url))
    }
    return null
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protect user portal routes
  if (req.nextUrl.pathname.startsWith("/portal")) {
    if (!isAuth) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }
})

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/login", "/register"],
}
