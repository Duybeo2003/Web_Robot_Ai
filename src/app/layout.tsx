import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSheet } from "@/components/cart-sheet";
import { CartSyncer } from "@/components/cart-syncer";
import { Toaster } from "@/components/ui/sonner";
import { StoreWrapper } from "@/components/layout/store-wrapper";
import { AffiliateTracker } from "@/components/affiliate-tracker";
import { FloatingSocialBar } from "@/components/layout/floating-social-bar";
import dynamicImport from "next/dynamic";
import { getBusinessIdentity } from "@/lib/commerce-policy";
import { AuthModalLauncher } from "@/components/auth-modal-launcher";

const AuthModal = dynamicImport(() => import("@/components/auth-modal").then((mod) => mod.AuthModal));

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  manifest: "/manifest.json",
  title: "RoboEQ - Đồ chơi Công nghệ & Giáo dục STEM",
  description:
    "Cửa hàng RoboEQ chuyên cung cấp đồ chơi công nghệ, kit Arduino, robot giáo dục STEM giúp phát triển tư duy logic và kỹ năng lập trình cho trẻ.",
  openGraph: {
    title: "RoboEQ - Đồ chơi Công nghệ & Giáo dục STEM",
    description:
      "Cửa hàng RoboEQ chuyên cung cấp đồ chơi công nghệ, kit Arduino, robot giáo dục STEM.",
    url: "/",
    siteName: "RoboEQ",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RoboEQ - Đồ chơi Công nghệ",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const business = getBusinessIdentity();

  return (
    <html
      lang="vi"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background/95"
        suppressHydrationWarning
      >
        <Providers>
          <StoreWrapper>
            <Header supportPhone={business.supportPhone} />
          </StoreWrapper>
          <main className="flex-1 flex flex-col">{children}</main>
          <StoreWrapper>
            <Footer />
            <AuthModal
              googleEnabled={Boolean(
                process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
              )}
              facebookEnabled={Boolean(
                process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
              )}
            />
            <CartSheet />
            <CartSyncer />
          </StoreWrapper>
          <Toaster />
          <FloatingSocialBar />
          <Suspense fallback={null}>
            <AuthModalLauncher />
            <AffiliateTracker />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
