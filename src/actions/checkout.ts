"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, type PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationEmail,
} from "@/lib/email";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createGuestOrderToken,
  hashGuestOrderToken,
  verifyActiveGuestOrderToken,
} from "@/lib/order-access";
import { z } from "zod";
import { normalizeVietnamPhone } from "@/lib/phone";
import { getRequestFingerprint } from "@/lib/request-fingerprint";
import { hashOtp } from "@/lib/otp";
import { inventoryMovementKey } from "@/lib/inventory-ledger";
import {
  PAYMENT_RESERVATION_HOURS,
  GUEST_ORDER_ACCESS_HOURS,
  POLICY_VERSION,
  VNPAY_RESERVATION_MINUTES,
} from "@/lib/commerce-policy";

class CheckoutError extends Error {}

const checkoutSchema = z.object({
  receiverName: z.string().trim().min(2).max(100),
  shippingAddress: z.string().trim().min(8).max(500),
  receiverPhone: z
    .string()
    .trim()
    .regex(/^(?:\+84|0)[0-9]{9,10}$/, "Số điện thoại không hợp lệ."),
  guestOtp: z.string().regex(/^\d{6}$/).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "VNPAY"]),
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1).max(191),
        quantity: z.number().int().min(1).max(99),
        expectedUnitPrice: z.number().finite().nonnegative().max(100_000_000_000),
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
  acceptedTerms: z.boolean().refine(Boolean, "Bạn cần đồng ý với điều khoản mua hàng."),
});

export async function processCheckout(data: {
  receiverName: string;
  shippingAddress: string;
  receiverPhone: string;
  guestOtp?: string;
  paymentMethod: PaymentMethod;
  cartItems: {
    productId: string;
    quantity: number;
    expectedUnitPrice: number;
    variantId?: string | null;
  }[];
  couponCode?: string;
  pointsToUse?: number;
  affiliateRef?: string;
  idempotencyKey: string;
  acceptedTerms: boolean;
}) {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Dữ liệu đặt hàng không hợp lệ.",
    };
  }
  data = parsed.data;
  const normalizedPhone = normalizeVietnamPhone(data.receiverPhone);
  if (!normalizedPhone) return { error: "Số điện thoại không hợp lệ." };
  data.receiverPhone = normalizedPhone;

  if (
    data.paymentMethod === "VNPAY" &&
    (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET || !process.env.VNP_RETURN_URL)
  ) {
    return { error: "Cổng VNPay chưa được cấu hình. Vui lòng chọn phương thức khác." };
  }
  if (
    data.paymentMethod === "BANK_TRANSFER" &&
    (!process.env.BANK_ID || !process.env.BANK_ACCOUNT_NO || !process.env.BANK_ACCOUNT_NAME)
  ) {
    return { error: "Tài khoản nhận chuyển khoản chưa được cấu hình. Vui lòng chọn phương thức khác." };
  }

  const session = await auth();
  let userId = session?.user?.id;
  const isGuestCheckout = !userId;
  const guestAccessToken = isGuestCheckout
    ? createGuestOrderToken(data.idempotencyKey)
    : undefined;

  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: {
      id: true,
      userId: true,
      guestAccessTokenHash: true,
      guestAccessExpiresAt: true,
      amountDue: true,
      paymentStatus: true,
    },
  });
  if (existingOrder) {
    const canReuse = userId
      ? existingOrder.userId === userId
      : Boolean(
          existingOrder.guestAccessTokenHash &&
            verifyActiveGuestOrderToken(
              guestAccessToken!,
              existingOrder.guestAccessTokenHash,
              existingOrder.guestAccessExpiresAt,
            ),
        );
    if (!canReuse) return { error: "Yêu cầu đặt hàng không hợp lệ." };
    return {
      success: true,
      orderId: existingOrder.id,
      guestAccessToken,
      paymentRequired:
        existingOrder.paymentStatus !== "PAID" && Number(existingOrder.amountDue) > 0,
    };
  }

  if (isGuestCheckout && !data.guestOtp) {
    return { error: "Vui lòng xác thực số điện thoại trước khi đặt hàng." };
  }

  if (userId) {
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!existingUser) {
      return { error: "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại." };
    }
  }

  const rateLimitKey = userId
    ? `rl:checkout:uid:${userId}` 
    : `rl:checkout:phone:${data.receiverPhone.replace(/\D/g, "")}`;
  const fingerprint = await getRequestFingerprint();
  const [customerLimit, addressLimit] = await Promise.all([
    checkRateLimit(rateLimitKey, 3, 60, { failClosed: true }),
    checkRateLimit(`rl:checkout:address:${fingerprint}`, 10, 60, { failClosed: true }),
  ]);
  if (!customerLimit.success || !addressLimit.success) {
    return { error: "Bạn đã đặt quá nhiều đơn hàng trong thời gian ngắn. Vui lòng thử lại sau 1 phút." };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      if (!userId) {
        const consumedOtp = await tx.otpCode.deleteMany({
          where: {
            phoneNumber: data.receiverPhone,
            code: hashOtp(data.receiverPhone, data.guestOtp!),
            expiresAt: { gt: new Date() },
          },
        });
        if (consumedOtp.count !== 1) {
          throw new CheckoutError("Mã OTP không chính xác hoặc đã hết hạn.");
        }

        const phoneOwner = await tx.user.findUnique({
          where: { phoneNumber: data.receiverPhone },
          select: { id: true, deletedAt: true },
        });
        if (phoneOwner?.deletedAt) {
          throw new CheckoutError("Số điện thoại này thuộc tài khoản đã ngừng hoạt động. Vui lòng liên hệ hỗ trợ.");
        }
        const guestUser = await tx.user.upsert({
          where: { phoneNumber: data.receiverPhone },
          update: {},
          create: { phoneNumber: data.receiverPhone, name: data.receiverName },
          select: { id: true },
        });
        userId = guestUser.id;
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
          flashSaleEndDate: true,
          flashSaleStock: true,
          variants: true,
          supplyType: true,
          depositPercent: true,
          commissionRate: true
        },
      });

      if (dbProducts.length !== productIds.length) {
        throw new CheckoutError("Một số sản phẩm không tồn tại hoặc đã bị xóa.");
      }

      if (dbProducts.some((product) => product.supplyType === "AFFILIATE_SELL")) {
        throw new CheckoutError(
          "Sản phẩm bán qua đối tác cần được mua tại liên kết trên trang sản phẩm.",
        );
      }

      if (
        data.paymentMethod === "COD" &&
        dbProducts.some((product) => product.supplyType === "PRE_ORDER")
      ) {
        throw new CheckoutError("Đơn có sản phẩm đặt trước cần thanh toán tiền cọc trước.");
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
          throw new CheckoutError(`Phân loại của sản phẩm "${dbProduct.title}" không còn tồn tại.`);
        }
        
        const currentInventory = variant ? variant.inventoryCount : dbProduct.inventoryCount;
        const currentPrice = variant ? Number(variant.price) : Number(dbProduct.price);

        if (currentPrice !== cartItem.expectedUnitPrice) {
          throw new CheckoutError(
            `Giá của "${dbProduct.title}" vừa thay đổi. Vui lòng tải lại trang và kiểm tra tổng tiền trước khi đặt hàng.`,
          );
        }
        
        let itemName = dbProduct.title;
        if (variant && variant.attributes && typeof variant.attributes === 'object') {
          itemName = `${dbProduct.title} - ${Object.values(variant.attributes as Record<string, string>).join(' - ')}`;
        }

        const flashSaleIsActive = Boolean(
          dbProduct.flashSaleActive &&
            dbProduct.flashSaleEndDate &&
            dbProduct.flashSaleEndDate > new Date() &&
            dbProduct.flashSaleStock !== null,
        );

        if (variant) {
          const updatedVariant = await tx.productVariant.updateMany({
            where: {
              id: variant.id,
              productId: dbProduct.id,
              inventoryCount: { gte: cartItem.quantity },
            },
            data: { inventoryCount: { decrement: cartItem.quantity } }
          });
          if (updatedVariant.count === 0) {
            throw new CheckoutError(`Sản phẩm "${itemName}" không đủ số lượng trong kho (còn ${currentInventory}).`);
          }
        } else {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: dbProduct.id,
              deletedAt: null,
              inventoryCount: { gte: cartItem.quantity },
            },
            data: {
              inventoryCount: { decrement: cartItem.quantity }
            }
          });
          if (updatedProduct.count === 0) {
            throw new CheckoutError(`Sản phẩm "${itemName}" không đủ số lượng trong kho (còn ${currentInventory}).`);
          }
        }

        if (flashSaleIsActive) {
          const updatedFlashSale = await tx.product.updateMany({
            where: {
              id: dbProduct.id,
              flashSaleActive: true,
              flashSaleEndDate: { gt: new Date() },
              flashSaleStock: { gte: cartItem.quantity },
            },
            data: { flashSaleStock: { decrement: cartItem.quantity } },
          });
          if (updatedFlashSale.count === 0) {
            throw new CheckoutError(
              `Sản phẩm "${dbProduct.title}" không còn đủ suất Flash Sale.`,
            );
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
            throw new CheckoutError("Mã giảm giá đã hết hạn.");
          }

          // Check minOrderValue
          if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
            throw new CheckoutError(`Mã giảm giá yêu cầu đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString("vi-VN")}đ`);
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
            throw new CheckoutError("Mã giảm giá đã hết lượt sử dụng.");
          }
        } else {
           throw new CheckoutError("Mã giảm giá không tồn tại hoặc đã ngừng hoạt động.");
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
            throw new CheckoutError("Bạn không đủ điểm thưởng.");
          }
        }
      }
      
      // Calculate final total (ensure it doesn't go below 0)
      discountAmount = couponDiscount + pointDiscount;
      const totalAmount = Math.max(0, Math.round(subtotal - discountAmount));
      depositAmount =
        subtotal > 0 && totalAmount > 0
          ? Math.min(
              totalAmount,
              Math.max(1, Math.round(depositAmount * (totalAmount / subtotal))),
            )
          : 0;
      totalCommissionAmount =
        subtotal > 0
          ? Math.max(0, Math.round(totalCommissionAmount * (totalAmount / subtotal)))
          : 0;
      
      // Calculate points earned (10,000 VND = 1 point based on FINAL amount)
      const pointsEarned = Math.floor(totalAmount / 10000);
      const paymentRequired = totalAmount > 0;

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
          paymentStatus: paymentRequired ? "UNPAID" : "PAID",
          status: paymentRequired ? "PENDING" : "PROCESSING",
          customerName: data.receiverName,
          idempotencyKey: data.idempotencyKey,
          guestAccessTokenHash: guestAccessToken
            ? hashGuestOrderToken(guestAccessToken)
            : null,
          guestAccessExpiresAt: guestAccessToken
            ? new Date(Date.now() + GUEST_ORDER_ACCESS_HOURS * 60 * 60 * 1_000)
            : null,
          termsVersion: POLICY_VERSION,
          termsAcceptedAt: new Date(),
          inventoryReservedUntil:
            !paymentRequired
                ? null
              : data.paymentMethod === "VNPAY"
                ? new Date(Date.now() + VNPAY_RESERVATION_MINUTES * 60 * 1000)
                : data.paymentMethod === "BANK_TRANSFER"
                  ? new Date(
                      Date.now() + PAYMENT_RESERVATION_HOURS * 60 * 60 * 1000,
                    )
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
              status: paymentRequired ? "PENDING" : "SUCCEEDED",
              processedAt: paymentRequired ? null : new Date(),
            },
          },
        },
        include: {
          user: { select: { email: true } },
          items: {
            include: { product: { select: { title: true } } },
          },
        },
      });

      await tx.inventoryTransaction.createMany({
        data: orderItemsData.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          orderId: newOrder.id,
          type: "OUT" as const,
          source: "SALE" as const,
          quantity: item.quantity,
          reference: newOrder.id,
          note: "Xuất kho khi tạo đơn hàng.",
          idempotencyKey: inventoryMovementKey(
            "SALE",
            newOrder.id,
            item.productId,
            item.variantId,
          ),
        })),
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
          select: { id: true },
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
      const userCart = !isGuestCheckout
        ? await tx.cart.findUnique({ where: { userId } })
        : null;
      if (userCart) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: userCart.id,
            selectionKey: {
              in: data.cartItems.map(
                (item) => `${item.productId}:${item.variantId || "base"}`,
              ),
            },
          }
        });
      }

      return newOrder;
    });

    const notifications: Promise<unknown>[] = [
      sendAdminNewOrderNotification(order.id, Number(order.totalAmount)),
    ];
    if (order.user.email) {
      notifications.push(
        sendOrderConfirmationEmail(
          order.user.email,
          order.id,
          Number(order.totalAmount),
          order.items.map((item) => ({
            quantity: item.quantity,
            priceAtPurchase: Number(item.priceAtPurchase),
            product: item.product,
          })),
        ),
      );
    }
    await Promise.allSettled(notifications);

    revalidatePath("/admin/orders");
    return {
      success: true,
      orderId: order.id,
      guestAccessToken,
      paymentRequired: Number(order.amountDue) > 0,
    };
  } catch (error: unknown) {
    logger.error("checkout.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const racedOrder = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        select: {
          id: true,
          userId: true,
          guestAccessTokenHash: true,
          guestAccessExpiresAt: true,
          amountDue: true,
        },
      });
      const ownsRacedOrder = racedOrder && (isGuestCheckout
        ? Boolean(
            racedOrder.guestAccessTokenHash &&
              verifyActiveGuestOrderToken(
                guestAccessToken!,
                racedOrder.guestAccessTokenHash,
                racedOrder.guestAccessExpiresAt,
              ),
          )
        : racedOrder.userId === session?.user?.id);
      if (racedOrder && ownsRacedOrder) {
        return {
          success: true,
          orderId: racedOrder.id,
          guestAccessToken,
          paymentRequired: Number(racedOrder.amountDue) > 0,
        };
      }
    }
    return {
      error:
        error instanceof CheckoutError
          ? error.message
          : "Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại.",
    };
  }
}
