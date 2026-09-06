"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function processCheckout(data: {
  receiverName?: string;
  shippingAddress: string;
  receiverPhone: string;
  paymentMethod: PaymentMethod;
  cartItems: { productId: string; quantity: number, variantId?: string | null }[];
  couponCode?: string;
  pointsToUse?: number;
  affiliateRef?: string;
}) {
  const session = await auth();
  let userId = session?.user?.id;

  if (userId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return { error: "Tài khoản của bạn không tồn tại (có thể do hệ thống vừa được phục hồi dữ liệu). Vui lòng Đăng xuất và Đăng nhập lại để tiếp tục." };
    }
  }

  // GUEST CHECKOUT LOGIC: Create shadow user for guest orders only
  if (!userId) {
    if (!data.receiverPhone) {
      return { error: "Vui lòng nhập số điện thoại để đặt hàng." };
    }
    
    // Always create a new shadow user for guest orders to prevent account hijacking
    const shadowUser = await prisma.user.create({
      data: {
        phoneNumber: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: data.receiverName || "Khách hàng",
      }
    });
    
    userId = shadowUser.id;
  }

  if (!data.cartItems || data.cartItems.length === 0) {
    return { error: "Giỏ hàng trống." };
  }

  // Rate Limiting: 3 orders per minute per user or phone number
  const rateLimitKey = userId 
    ? `rl:checkout:uid:${userId}` 
    : `rl:checkout:phone:${data.receiverPhone}`;
  
  const rl = await checkRateLimit(rateLimitKey, 3, 60);
  if (!rl.success) {
    return { error: "Bạn đã đặt quá nhiều đơn hàng trong thời gian ngắn. Vui lòng thử lại sau 1 phút." };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Query the current price directly from DB
      const productIds = data.cartItems.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { 
          id: true, 
          title: true, 
          price: true, 
          inventoryCount: true, 
          flashSaleActive: true, 
          flashSaleStock: true,
          variants: true,
          supplyType: true,
          depositPercent: true,
          commissionRate: true
        },
      });

      if (dbProducts.length !== productIds.length) {
        throw new Error("Một số sản phẩm không tồn tại hoặc đã bị xóa.");
      }

      let totalAmount = 0;
      let depositAmount = 0;
      const orderItemsData = [];
      let totalCommissionAmount = 0;
      
      for (const cartItem of data.cartItems) {
        const dbProduct = dbProducts.find((p) => p.id === cartItem.productId)!;
        
        const variant = cartItem.variantId 
          ? dbProduct.variants.find((v) => v.id === cartItem.variantId) 
          : null;
        
        const currentInventory = variant ? variant.inventoryCount : dbProduct.inventoryCount;
        const currentPrice = variant ? Number(variant.price) : Number(dbProduct.price);
        
        let itemName = dbProduct.title;
        if (variant && variant.attributes && typeof variant.attributes === 'object') {
          itemName = `${dbProduct.title} - ${Object.values(variant.attributes as Record<string, string>).join(' - ')}`;
        }

        // 1. Deduct Inventory FIRST (atomic), then check result
        // This prevents race conditions where two concurrent requests both
        // read "1 in stock" and both proceed to decrement.
        if (variant) {
          const updatedVariant = await tx.productVariant.update({
            where: { id: variant.id },
            data: { inventoryCount: { decrement: cartItem.quantity } }
          });
          if (updatedVariant.inventoryCount < 0) {
            throw new Error(`Sản phẩm "${itemName}" không đủ số lượng trong kho (còn ${currentInventory}).`);
          }
        } else {
          const updatedProduct = await tx.product.update({
            where: { id: dbProduct.id },
            data: {
              inventoryCount: { decrement: cartItem.quantity }
            }
          });
          if (updatedProduct.inventoryCount < 0) {
            throw new Error(`Sản phẩm "${itemName}" không đủ số lượng trong kho (còn ${currentInventory}).`);
          }
          // Deduct Flash Sale stock if applicable
          if (dbProduct.flashSaleActive && dbProduct.flashSaleStock !== null) {
            const updatedFS = await tx.product.update({
              where: { id: dbProduct.id },
              data: { flashSaleStock: { decrement: cartItem.quantity } },
            });
            if (updatedFS.flashSaleStock !== null && updatedFS.flashSaleStock < 0) {
              throw new Error(`Sản phẩm "${dbProduct.title}" chỉ còn ${dbProduct.flashSaleStock} suất Flash Sale.`);
            }
          }
        }
        
        // 4. Calculate amounts
        totalAmount += currentPrice * cartItem.quantity;
        if (dbProduct.supplyType === "PRE_ORDER" && dbProduct.depositPercent) {
          depositAmount += (currentPrice * cartItem.quantity * dbProduct.depositPercent) / 100;
        } else {
          depositAmount += currentPrice * cartItem.quantity; // Pay 100%
        }
        
        // 5. Calculate commission if valid affiliate ref
        if (data.affiliateRef && dbProduct.supplyType === "AFFILIATE_HOST" && dbProduct.commissionRate) {
          totalCommissionAmount += (currentPrice * cartItem.quantity * dbProduct.commissionRate) / 100;
        }
        
        // 6. Build OrderItem
        orderItemsData.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId || null,
          quantity: cartItem.quantity,
          priceAtPurchase: currentPrice, // mapping database price (CRITICAL)
        });
      }

      // 1.5 Handle Coupon
      let discountAmount = 0;
      
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode.toUpperCase() },
        });
        if (coupon && coupon.isActive) {
          const now = new Date();
          if (coupon.expiresAt && coupon.expiresAt <= now) {
            throw new Error("Mã giảm giá đã hết hạn.");
          }

          // Check minOrderValue
          if (coupon.minOrderValue && totalAmount < Number(coupon.minOrderValue)) {
            throw new Error(`Mã giảm giá yêu cầu đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString("vi-VN")}đ`);
          }
          
          if (coupon.discountPercent) {
            discountAmount += totalAmount * (coupon.discountPercent / 100);
          } else if (coupon.discountValue) {
            discountAmount += Number(coupon.discountValue);
          }
          
          // C2 Fix: Atomic increment - prevents race condition on usage
          const updatedCoupon = await tx.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
          if (coupon.usageLimit && updatedCoupon.usageCount > coupon.usageLimit) {
            throw new Error("Mã giảm giá đã hết lượt sử dụng.");
          }
        } else {
           throw new Error("Mã giảm giá không tồn tại hoặc đã ngừng hoạt động.");
        }
      }

      // 1.6 Handle Loyalty Points (1 point = 1000 VND)
      let pointsUsed = 0;
      if (data.pointsToUse && data.pointsToUse > 0) {
        // C7 Fix: Clamp points so user doesn't burn more than totalAmount
        const maxPointsValue = totalAmount - discountAmount; // remaining amount after coupon
        const maxPointsAllowed = Math.floor(Math.max(0, maxPointsValue) / 1000);
        pointsUsed = Math.min(data.pointsToUse, maxPointsAllowed);
        
        if (pointsUsed > 0) {
          discountAmount += pointsUsed * 1000;
          
          // C1 Fix: Atomic decrement - prevents race condition
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { points: { decrement: pointsUsed } }
          });
          if (updatedUser.points < 0) {
            throw new Error("Bạn không đủ điểm thưởng.");
          }
        }
      }
      
      // Calculate final total (ensure it doesn't go below 0)
      totalAmount = Math.max(0, totalAmount - discountAmount);
      
      // Calculate points earned (10,000 VND = 1 point based on FINAL amount)
      const pointsEarned = Math.floor(totalAmount / 10000);

      // 2 & 3. Create the Order with the verified total amount
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          depositAmount,
          shippingAddress: data.shippingAddress,
          receiverPhone: data.receiverPhone,
          paymentMethod: data.paymentMethod,
          discountAmount,
          pointsUsed,
          pointsEarned,
          items: {
            create: orderItemsData,
          },
        },
      });

      // 4. Create Commission if applicable
      if (data.affiliateRef && totalCommissionAmount > 0) {
        // verify affiliateRef exists as user
        const affiliateUser = await tx.user.findUnique({ where: { id: data.affiliateRef } });
        if (affiliateUser) {
          await tx.commission.create({
            data: {
              orderId: newOrder.id,
              affiliateUserId: data.affiliateRef,
              amount: totalCommissionAmount,
              status: "PENDING"
            }
          });
        }
      }

      // 4. Clear the specific user's CartItem records
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: userCart.id,
            productId: { in: data.cartItems.map(i => i.productId) }
          }
        });
      }

      return newOrder;
    });

    // 5. Send Email Notifications in the background
    if (session?.user?.email) {
      sendOrderConfirmationEmail(
        session.user.email,
        order.id,
        Number(order.totalAmount),
      ).catch(console.error);
    }

    // Notify admin

    revalidatePath("/admin/orders");
    return { success: true, orderId: order.id };
  } catch (error: unknown) {
    console.error("[CHECKOUT_ERROR]", error);
    const msg = error instanceof Error ? error.message : "Có lỗi xảy ra khi xử lý đơn hàng.";
    return { error: msg };
  }
}

export async function processVNPayMock(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // SECURITY: Only ADMIN can trigger mock payments
  if (user?.role !== "ADMIN") {
    return { error: "Chỉ Admin mới có quyền thực hiện thao tác này." };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { error: "Order not found" };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
      },
    });

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch {
    return { error: "Failed to process mock payment" };
  }
}
