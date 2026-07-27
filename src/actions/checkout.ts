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
  cartItems: { productId: string; quantity: number }[];
  couponCode?: string;
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
          flashSaleStock: true 
        },
      });

      if (dbProducts.length !== productIds.length) {
        throw new Error("Một số sản phẩm không tồn tại hoặc đã bị xóa.");
      }

      let totalAmount = 0;
      const orderItemsData = [];
      
      for (const cartItem of data.cartItems) {
        const dbProduct = dbProducts.find((p) => p.id === cartItem.productId)!;
        
        // 1. Check Inventory
        if (dbProduct.inventoryCount < cartItem.quantity) {
          throw new Error(`Sản phẩm "${dbProduct.title}" không đủ số lượng trong kho (còn ${dbProduct.inventoryCount}).`);
        }
        
        // 2. Check Flash Sale
        if (dbProduct.flashSaleActive) {
          if (dbProduct.flashSaleStock !== null && dbProduct.flashSaleStock < cartItem.quantity) {
            throw new Error(`Sản phẩm "${dbProduct.title}" chỉ còn ${dbProduct.flashSaleStock} suất Flash Sale.`);
          }
        }
        
        // 3. Deduct Inventory (using await tx.product.update)
        await tx.product.update({
          where: { id: dbProduct.id },
          data: {
            inventoryCount: { decrement: cartItem.quantity },
            ...(dbProduct.flashSaleActive && dbProduct.flashSaleStock !== null
              ? { flashSaleStock: { decrement: cartItem.quantity } }
              : {})
          }
        });
        
        const price = Number(dbProduct.price);
        totalAmount += price * cartItem.quantity;

        orderItemsData.push({
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          priceAtPurchase: price, // mapping database price (CRITICAL)
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
          shippingAddress: data.shippingAddress,
          receiverPhone: data.receiverPhone,
          paymentMethod: data.paymentMethod,
          items: {
            create: orderItemsData,
          },
        },
      });

      // 4. Clear the specific user's CartItem records
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return newOrder;
    });

    // 5. Send Email Notifications in the background
    if (session.user.email) {
      sendOrderConfirmationEmail(
        session.user.email,
        order.id,
        Number(order.totalAmount),
      ).catch(console.error);
    }

    // Notify admin

    revalidatePath("/admin/orders");
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("[CHECKOUT_ERROR]", error);
    return { error: error.message || "Có lỗi xảy ra khi xử lý đơn hàng." };
  }
}

export async function processVNPayMock(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // SECURITY: Only ADMIN can trigger mock payments
  if ((session.user as any).role !== "ADMIN") {
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
  } catch (e: any) {
    return { error: "Failed to process mock payment" };
  }
}
