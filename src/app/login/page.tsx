"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthModal } from "@/store/use-auth-modal"

/**
 * /login page – NextAuth redirects here on sign-in.
 * We redirect to home and open the AuthModal instead.
 */
export default function LoginPage() {
  const router = useRouter()
  const { openModal } = useAuthModal()

  useEffect(() => {
    // Redirect to homepage and trigger the auth modal
    router.replace("/")
    // Small delay to ensure the page is loaded before opening modal
    const timer = setTimeout(() => {
      openModal()
    }, 100)
    return () => clearTimeout(timer)
  }, [router, openModal])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
