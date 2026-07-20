"use client"

import { useState, useEffect } from "react"
import { useAuthModal } from "@/store/use-auth-modal"
import { signIn, useSession } from "next-auth/react"
import { generateOtp } from "@/actions/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Loader2, ArrowLeft } from "lucide-react"

export function AuthModal() {
  const { isOpen, closeModal } = useAuthModal()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("password")
  const [phone, setPhone] = useState("+84")
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  // Timer effect for OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setLoginMethod("password")
        setPhone("+84")
        setOtp("")
        setEmail("")
        setPassword("")
        setError("")
        setCountdown(0)
      }, 300)
    }
  }, [isOpen])

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError("")
    
    if (phone.length < 10) {
      setError("Vui lòng nhập số điện thoại hợp lệ.")
      return
    }

    setIsLoading(true)
    const res = await generateOtp(phone)
    setIsLoading(false)

    if (res.success) {
      setStep(2)
      setCountdown(60) // 60s countdown
    } else {
      setError(res.error || "Không thể gửi OTP. Thử lại sau.")
    }
  }

  const { data: session, update } = useSession()

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError("")
    
    if (otp.length !== 6) {
      setError("Mã OTP phải gồm 6 chữ số.")
      return
    }

    setIsLoading(true)
    
    // next-auth signIn with custom credentials provider
    const result = await signIn("credentials-otp", {
      phone,
      otp,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError("Mã OTP không chính xác hoặc đã hết hạn.")
    } else {
      await update()
      closeModal()
      window.location.reload()
    }
  }

  const handleSocialLogin = (provider: "google" | "facebook") => {
    setIsLoading(true)
    signIn(provider, { redirect: false }).then(() => {
        setIsLoading(false)
        closeModal()
        window.location.reload()
    }).catch(() => setIsLoading(false))
  }

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.")
      return
    }

    setIsLoading(true)
    const result = await signIn("credentials-password", {
      email,
      password,
      redirect: false,
    })
    setIsLoading(false)

    if (result?.error) {
      setError("Email hoặc mật khẩu không chính xác.")
    } else {
      await update()
      closeModal()
      window.location.reload()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[400px] rounded-sm p-6 sm:p-8 bg-[#F9F8F6] border-stone-200 shadow-none">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-lora font-semibold text-center text-[#2C2C2C]">
            {step === 1 ? "Đăng nhập" : "Xác thực OTP"}
          </DialogTitle>
          <DialogDescription className="text-center text-[#2C2C2C]/70 mt-2 font-manrope text-sm">
            {step === 1 
              ? "Chào mừng bạn đến với robot giáo dục." 
              : `Mã 6 số đã được gửi đến ${phone}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 font-manrope">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-sm text-center border border-red-100 animate-in fade-in duration-300">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              {loginMethod === "otp" ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-[#2C2C2C]">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+84..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 text-base rounded-sm border-stone-200 bg-white focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary"
                      autoComplete="tel"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-sm text-base font-medium bg-[#C86B5A] hover:bg-[#C86B5A]/90 text-white transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Tiếp tục bằng SĐT
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-[#2C2C2C]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base rounded-sm border-stone-200 bg-white focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-[#2C2C2C]">Mật khẩu</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base rounded-sm border-stone-200 bg-white focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-sm text-base font-medium bg-[#C86B5A] hover:bg-[#C86B5A]/90 text-white transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Đăng nhập
                  </Button>
                </form>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className="text-sm font-medium text-[#C86B5A] hover:underline"
                  onClick={() => {
                    setError("")
                    setLoginMethod(loginMethod === "otp" ? "password" : "otp")
                  }}
                >
                  {loginMethod === "otp" ? "Đăng nhập bằng Mật Khẩu" : "Đăng nhập bằng OTP (SĐT)"}
                </button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-medium">
                  <span className="bg-[#F9F8F6] px-4 text-[#2C2C2C]/60">
                    Hoặc đăng nhập với
                  </span>
                </div>
              </div>

              {!session?.user && (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-[#2C2C2C] transition-colors font-medium"
                    onClick={() => handleSocialLogin("google")}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                      />
                      <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                      />
                      <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                      />
                      <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 rounded-sm border border-stone-200 bg-white hover:bg-[#1877F2]/5 hover:border-[#1877F2]/20 hover:text-[#1877F2] transition-colors font-medium"
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                    </svg>
                    Facebook
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={handleVerifyOtp} className="space-y-6 flex flex-col items-center">
                <div className="flex justify-center w-full px-2">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp} 
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot 
                          key={i} 
                          index={i} 
                          className="w-10 h-12 sm:w-11 sm:h-14 text-xl font-medium rounded-sm border border-stone-200 bg-white transition-all focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary" 
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-sm text-base font-medium bg-[#C86B5A] hover:bg-[#C86B5A]/90 text-white transition-colors" 
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Xác nhận
                </Button>

                <div className="flex items-center justify-between w-full text-sm mt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-[#2C2C2C]/70 hover:text-[#2C2C2C] transition-colors py-2 px-1"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
                  </button>
                  
                  {countdown > 0 ? (
                    <span className="text-[#2C2C2C]/50 px-2">Gửi lại sau {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-[#C86B5A] hover:text-[#C86B5A]/80 transition-colors py-2 px-1 font-medium"
                      disabled={isLoading}
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
