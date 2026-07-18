"use client";

import { useCartStore } from "@/lib/store/cart";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center flex-1">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
        <p className="text-muted-foreground mb-8">Hãy khám phá các sản phẩm công nghệ và giáo dục của chúng tôi.</p>
        <Link href="/shop">
          <Button size="lg" className="rounded-full">Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex-1">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Giỏ hàng ({items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="96px" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">RoboEd</div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <Link href={`/shop/${item.slug}`} className="font-bold text-lg hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </Link>
                <div className="text-primary font-bold mt-1">{formatPrice(item.price)}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border/50 rounded-full bg-background">
                  <button 
                    className="w-8 h-8 flex items-center justify-center hover:text-primary"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button 
                    className="w-8 h-8 flex items-center justify-center hover:text-primary"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-3xl sticky top-24">
            <h3 className="text-xl font-bold mb-6">Tổng đơn hàng</h3>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
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

            <Button size="lg" className="w-full rounded-full gap-2 shadow-lg hover:shadow-primary/20 h-14 text-base">
              Tiến hành Thanh toán <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
