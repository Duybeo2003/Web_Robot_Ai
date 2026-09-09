"use client";

import { useCartStore } from "@/lib/store/cart";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 flex size-24 items-center justify-center rounded-2xl bg-muted">
          <Trash2 className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
        <p className="text-muted-foreground mb-8">
          Hãy khám phá các sản phẩm công nghệ và giáo dục của chúng tôi.
        </p>
        <Link href="/shop">
          <Button size="lg" className="rounded-xl">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex-1 px-4 py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">
        Giỏ hàng ({items.reduce((acc, item) => acc + item.quantity, 0)} sản
        phẩm)
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.id}:${item.variantId || "base"}`}
              className="flex flex-col items-stretch gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-5"
            >
              <div className="size-24 shrink-0 self-center overflow-hidden rounded-xl bg-muted sm:self-auto">
                {item.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                    className="object-contain p-1"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    RoboEQ
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <Link
                  href={`/shop/${item.slug}`}
                  className="line-clamp-2 text-base font-bold transition-colors hover:text-primary sm:text-lg"
                >
                  {item.title}
                </Link>
                <div className="text-primary font-bold mt-1">
                  {formatPrice(item.price)}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 sm:justify-end">
                <div className="flex items-center rounded-xl border border-border bg-background">
                  <button
                    type="button"
                    aria-label={`Giảm số lượng ${item.title}`}
                    className="flex size-10 items-center justify-center rounded-l-xl hover:bg-neutral-50 hover:text-primary"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tăng số lượng ${item.title}`}
                    className="flex size-10 items-center justify-center rounded-r-xl hover:bg-neutral-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                    disabled={
                      item.quantity >= Math.min(99, item.inventoryCount ?? 99)
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  aria-label={`Xóa ${item.title} khỏi giỏ hàng`}
                  onClick={() => removeItem(item.id, item.variantId)}
                  className="flex size-10 items-center justify-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Tổng đơn hàng</h3>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-medium text-foreground">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Tiến hành thanh toán <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
