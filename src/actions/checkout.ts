"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { createGuestOrderToken, hashGuestOrderToken } from "@/lib/order-access";
import { z } from "zod";
import crypto from "crypto";

const checkoutSchema = z.object({
  receiverName: z.string().trim().min(2).max(100),
  shippingAddress: z.string().trim().min(8).max(500),
  receiverPhone: z
    .string()
    .trim()
    .regex(/^(?:\+84|0)[0-9]{9,10}$/, "Số điện thoại không hợp lệ."),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "VNPAY"]),
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1).max(191),
        quantity: z.number().int().min(1).max(99),
        variantId: z.string().min(1).max(191).nullish(),
      }),
    )
    .min(1)
    .max(100)
    .refine(
      (items) =>
        new Set(items.map((item) => `${item.productId}:${item.variantId || "base"}`))
          .size === items.length,
      "Giỏ hàng chứa sản phẩm trùng lặp.",
    ),
  couponCode: z.string().trim().max(50).optional(),
  pointsToUse: z.number().int().min(0).max(1_000_000).optional(),
  affiliateRef: z.string().min(1).max(191).optional(),
  idempotencyKey: z.string().uuid(),
});

export async function processCheckout(data: {
  receiverName?: string;
  shippingAddress: string;
  receiverPhone: string;
  paymentMethod: PaymentMethod;
  cartItems: { productId: string; quantity: number, variantId?: string | null }[];
  couponCode?: string;
  pointsToUse?: number;
  affiliateRef?: string;
  idempotencyKey: string;
}) {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Dữ liệu đặt hàng không hợp lệ.",
    };
  }
  data = parsed.data;

  const session = await auth();
  let userId = session?.user?.id;
  const isGuestCheckout = !userId;
  const guestAccessToken = isGuestCheckout
    ? createGuestOrderToken(data.idempotencyKey)
    : undefined;

  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { id: true, userId: true, guestAccessTokenHash: true },
  });
  if (existingOrder) {
    const canReuse = userId
      ? existingOrder.userId === userId
      : existingOrder.guestAccessTokenHash ===
        hashGuestOrderToken(guestAccessToken!);
    if (!canReuse) return { error: "Yêu cầu đặt hàng không hợp lệ." };
    return { success: true, orderId: existingOrder.id, guestAccessToken };
  }

  if (userId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return { error: "Tài khoản của bạn không tồn tại (có thể do hệ thống vừa được phục hồi dữ liệu). Vui lòng Đăng xuất và Đăng nhập lại để tiếp tục." };
    }
  }

  // Rate Limiting: 3 orders per minute per user or phone number
  const rateLimitKey = userId 
    ? `rl:checkout:uid:${userId}` 
    : `rl:checkout:phone:${data.receiverPhone.replace(/\D/g, "")}`;
  
  const rl = await checkRateLimit(rateLimitKey, 3, 60, { failClosed: true });
  if (!rl.success) {
    return { error: "Bạn đã đặt quá nhiều đơn hàng trong thời gian ngắn. Vui lòng thử lại sau 1 phút." };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      if (!userId) {
        const shadowUser = await tx.user.create({
          data: {
            phoneNumber: `guest_${Date.now()}_${crypto.randomUUID()}`,
            name: data.receiverName,
          },
        });
        userId = shadowUser.id;
      }

      // 1. Query the current price directly from DB
      const productIds = [...new Set(data.cartItems.map((i) => i.productId))];
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
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

      let subtotal = 0;
      let depositAmount = 0;
      const orderItemsData = [];
      let totalCommissionAmount = 0;
      
      for (const cartItem of data.cartItems) {
        const dbProduct = dbProducts.find((p) => p.id === cartItem.productId)!;
        
        const variant = cartItem.variantId 
          ? dbProduct.variants.find((v) => v.id === cartItem.variantId) 
          : null;
        if (cartItem.variantId && !variant) {
          throw new Error(`Phân loại của sản phẩm "${dbProduct.title}" không còn tồn tại.`);
        }
        
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
        subtotal += currentPrice * cartItem.quantity;
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
          if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
            throw new Error(`Mã giảm giá yêu cầu đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString("vi-VN")}đ`);
          }
          
          if (coupon.discountPercent) {
            discountAmount += subtotal * (coupon.discountPercent / 100);
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

      subtotal = Math.round(subtotal);
      const couponDiscount = Math.min(
        subtotal,
        Math.max(0, Math.round(discountAmount)),
      );

      // 1.6 Handle Loyalty Points (1 point = 1000 VND)
      let pointsUsed = 0;
      let pointDiscount = 0;
      if (!isGuestCheckout && data.pointsToUse && data.pointsToUse > 0) {
        // C7 Fix: Clamp points so user doesn't burn more than totalAmount
        const maxPointsValue = subtotal - couponDiscount;
        const maxPointsAllowed = Math.floor(Math.max(0, maxPointsValue) / 1000);
        pointsUsed = Math.min(data.pointsToUse, maxPointsAllowed);
        
        if (pointsUsed > 0) {
          pointDiscount = pointsUsed * 1000;
          
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
      discountAmount = couponDiscount + pointDiscount;
      const totalAmount = Math.max(0, Math.round(subtotal - discountAmount));
      depositAmount = Math.min(
        totalAmount,
        Math.max(0, Math.round(depositAmount - discountAmount)),
      );
      totalCommissionAmount = Math.max(0, Math.round(totalCommissionAmount));
      
      // Calculate points earned (10,000 VND = 1 point based on FINAL amount)
      const pointsEarned = Math.floor(totalAmount / 10000);

      // 2 & 3. Create the Order with the verified total amount
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          depositAmount,
          subtotal,
          shippingFee: 0,
          couponCode: data.couponCode?.toUpperCase() || null,
          couponDiscount,
          pointDiscount,
          amountPaid: 0,
          amountDue: totalAmount,
          customerName: data.receiverName,
          idempotencyKey: data.idempotencyKey,
          guestAccessTokenHash: guestAccessToken
            ? hashGuestOrderToken(guestAccessToken)
            : null,
          inventoryReservedUntil:
            data.paymentMethod === "VNPAY"
              ? new Date(Date.now() + 20 * 60 * 1000)
              : null,
          shippingAddress: data.shippingAddress,
          receiverPhone: data.receiverPhone,
          paymentMethod: data.paymentMethod,
          discountAmount,
          pointsUsed,
          pointsEarned,
          items: {
            create: orderItemsData,
          },
          paymentTransactions: {
            create: {
              provider: data.paymentMethod,
              amount:
                data.paymentMethod === "COD" ? totalAmount : depositAmount,
              idempotencyKey: `checkout:${data.idempotencyKey}:payment`,
            },
          },
        },
      });

      // 4. Create Commission if applicable
      if (data.affiliateRef && totalCommissionAmount > 0) {
        // verify affiliateRef exists as user
        const affiliateUser = await tx.user.findFirst({
          where: {
            id: data.affiliateRef,
            deletedAt: null,
            NOT: { id: userId },
          },
        });
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
    return { success: true, orderId: order.id, guestAccessToken };
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
      include: {
        paymentTransactions: {
          where: { provider: "VNPAY" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) return { error: "Order not found" };
    const payment = order.paymentTransactions[0];
    if (!payment) return { error: "Payment not found" };

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.paymentTransaction.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "SUCCEEDED", processedAt: new Date() },
      });
      if (claimed.count === 0) return;

      const amountPaid = Number(order.amountPaid) + Number(payment.amount);
      const amountDue = Math.max(0, Number(order.totalAmount) - amountPaid);
      await tx.order.update({
        where: { id: orderId },
        data: {
          amountPaid,
          amountDue,
          paymentStatus: amountDue === 0 ? "PAID" : "PARTIALLY_PAID",
          status: "PROCESSING",
          inventoryReservedUntil: null,
        },
      });
    });

    revalidatePath("/profile/orders");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch {
    return { error: "Failed to process mock payment" };
  }
}
