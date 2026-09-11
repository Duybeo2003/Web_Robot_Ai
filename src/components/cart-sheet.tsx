/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCartStore } from "@/lib/store/cart";
import { useCartUI } from "@/store/use-cart-ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export function CartSheet() {
  const router = useRouter();
  const { isOpen, closeCart } = useCartUI();
  const { items, updateQuantity, removeItem } = useCartStore();
  const totalPrice = useMemo(() => items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  ), [items]);

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex !w-[calc(100%_-_1rem)] flex-col p-0 sm:!w-full sm:max-w-md">
        <SheetHeader className="border-b p-5 sm:p-6">
          <SheetTitle className="flex items-center text-xl font-bold">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Giỏ hàng của bạn
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5722] mb-2 shadow-inner">
              <ShoppingBag className="w-16 h-16 opacity-80" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-gray-800">Giỏ hàng trống</p>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy khám phá các
                robot giáo dục tuyệt vời của chúng tôi!
              </p>
            </div>
            <Button
              onClick={() => {
                closeCart();
                router.push("/shop");
              }}
              className="mt-6 rounded-xl bg-[#FF5722] hover:bg-[#E64A19] text-white px-8 h-12 shadow-md transition-transform hover:-translate-y-0.5"
            >
              Bắt đầu mua sắm
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4 sm:p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}:${item.variantId || "base"}`} className="rounded-xl border border-neutral-100 p-3">
                    <div className="flex gap-3">
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.imageUrl ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-contain p-1"
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={closeCart}
                            className="line-clamp-2 text-sm font-semibold transition-colors hover:text-primary"
                          >
                            {item.title}
                          </Link>
                          {item.variantAttributes && (
                            <div className="mt-1 text-xs text-neutral-500">
                              {Object.values(item.variantAttributes).join(" - ")}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Xóa ${item.title} khỏi giỏ hàng`}
                          onClick={() => removeItem(item.id, item.variantId)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border bg-background">
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${item.title}`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1, item.variantId)
                          }
                          className="flex size-8 items-center justify-center rounded-l-lg transition-colors hover:bg-gray-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${item.title}`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1, item.variantId)
                          }
                          className="flex size-8 items-center justify-center rounded-r-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={
                            item.quantity >= Math.min(99, item.inventoryCount ?? 99)
                          }
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-sm font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t bg-gray-50/50">
              <div className="bg-green-50 text-green-700 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 mb-4 text-sm font-medium border border-green-100">
                <Truck className="w-4 h-4" />
                Đơn hàng của bạn được miễn phí vận chuyển!
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-600">
                  Tổng tạm tính
                </span>
                <span className="text-xl font-bold text-[#E30019]">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Button
                className="w-full h-14 rounded-xl text-base font-bold bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => {
                  closeCart();
                  router.push("/checkout");
                }}
              >
                Tiến hành thanh toán
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
