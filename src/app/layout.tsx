import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthModal } from "@/components/auth-modal";
import { CartSheet } from "@/components/cart-sheet";
import { CartSyncer } from "@/components/cart-syncer";
import { Toaster } from "@/components/ui/sonner";
import { AIChatbot } from "@/components/ui/ai-chatbot";
import { StoreWrapper } from "@/components/layout/store-wrapper";

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoboEd - Đồ chơi Công nghệ & Giáo dục STEM",
  description: "Cửa hàng RoboEd chuyên cung cấp đồ chơi công nghệ, kit Arduino, robot giáo dục STEM giúp phát triển tư duy logic và kỹ năng lập trình cho trẻ.",
  openGraph: {
    title: "RoboEd - Đồ chơi Công nghệ & Giáo dục STEM",
    description: "Cửa hàng RoboEd chuyên cung cấp đồ chơi công nghệ, kit Arduino, robot giáo dục STEM.",
    url: "https://roboed.vn",
    siteName: "RoboEd",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RoboEd - Đồ chơi Công nghệ",
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
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background/95" suppressHydrationWarning>
        <Providers>
          <StoreWrapper>
            <Header />
          </StoreWrapper>
          <main className="flex-1 flex flex-col">{children}</main>
          <StoreWrapper>
            <Footer />
            <AuthModal />
            <CartSheet />
            <CartSyncer />
          </StoreWrapper>
          <Toaster />
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}
