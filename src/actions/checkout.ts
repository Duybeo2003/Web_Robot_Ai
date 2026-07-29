"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail } from "./email";

export async function processCheckout(data: {
  receiverName?: string;
  shippingAddress: string;
  receiverPhone: string;
  paymentMethod: PaymentMethod;
  cartItems: { productId: string; quantity: number, variantId?: string | null }[];
  couponCode?: string;
  affiliateRef?: string;
}) {
  const session = await auth();
  let userId = session?.user?.id;

  // GUEST CHECKOUT LOGIC: If no logged in user, find or create shadow user based on phone number
  if (!userId) {
    if (!data.receiverPhone) {
      return { error: "Vui lòng nhập số điện thoại để đặt hàng." };
    }
    
    // Check if user exists with this phone number
    let shadowUser = await prisma.user.findUnique({
      where: { phoneNumber: data.receiverPhone }
    });

    // Create a new shadow user if doesn't exist
    if (!shadowUser) {
      shadowUser = await prisma.user.create({
        data: {
          phoneNumber: data.receiverPhone,
          name: data.receiverName || "Khách hàng",
        }
      });
    }
    
    userId = shadowUser.id;
  }

  if (!data.cartItems || data.cartItems.length === 0) {
    return { error: "Giỏ hàng trống." };
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

        // 1. Check Inventory
        if (currentInventory < cartItem.quantity) {
          throw new Error(`Sản phẩm "${itemName}" không đủ số lượng trong kho (còn ${currentInventory}).`);
        }
        
        // 2. Check Flash Sale
        if (dbProduct.flashSaleActive) {
          if (dbProduct.flashSaleStock !== null && dbProduct.flashSaleStock < cartItem.quantity) {
            throw new Error(`Sản phẩm "${dbProduct.title}" chỉ còn ${dbProduct.flashSaleStock} suất Flash Sale.`);
          }
        }
        
        // 3. Deduct Inventory
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { inventoryCount: { decrement: cartItem.quantity } }
          });
        } else {
          await tx.product.update({
            where: { id: dbProduct.id },
            data: {
              inventoryCount: { decrement: cartItem.quantity }
            }
          });
          if (dbProduct.flashSaleStock !== null) {
            await tx.product.update({
              where: { id: dbProduct.id },
              data: { flashSaleStock: dbProduct.flashSaleStock - cartItem.quantity },
            });
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
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode },
        });
        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValid =
            (!coupon.expiresAt || coupon.expiresAt > now) &&
            (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit);

          if (isValid) {
            totalAmount =
              totalAmount - totalAmount * (coupon.discountPercent / 100);
            // increment usage count
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            });
          }
        }
      }

      // 2 & 3. Create the Order with the verified total amount
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          depositAmount,
          shippingAddress: data.shippingAddress,
          receiverPhone: data.receiverPhone,
          paymentMethod: data.paymentMethod,
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
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
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

    if (order?.userId !== session.user.id) return { error: "Unauthorized" };

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
