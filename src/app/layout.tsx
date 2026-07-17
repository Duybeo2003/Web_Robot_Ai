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

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoboEd - Premium EdTech & Nutrition",
  description: "Modern organic nutrition & sleek educational tech devices.",
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
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <AuthModal />
          <CartSheet />
          <CartSyncer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
