"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PaymentMethod } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { sendOrderConfirmationEmail } from "./email"

export async function processCheckout(data: {
  shippingAddress: string
  receiverPhone: string
  paymentMethod: PaymentMethod
  cartItems: { productId: string; quantity: number }[]
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Bạn cần đăng nhập để thanh toán." }
  }
  const userId = session.user.id

  if (!data.cartItems || data.cartItems.length === 0) {
    return { error: "Giỏ hàng trống." }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Query the current price directly from DB
      const productIds = data.cartItems.map((i) => i.productId)
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true }
      })

      if (dbProducts.length !== productIds.length) {
        throw new Error("Một số sản phẩm không tồn tại hoặc đã bị xóa.")
      }

      // Map DB prices and calculate total
      let totalAmount = 0
      const orderItemsData = data.cartItems.map((cartItem) => {
        const dbProduct = dbProducts.find((p) => p.id === cartItem.productId)!
        const price = Number(dbProduct.price)
        totalAmount += price * cartItem.quantity

        return {
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          priceAtPurchase: price, // mapping database price (CRITICAL)
        }
      })

      // 2 & 3. Create the Order with the verified total amount
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: data.shippingAddress,
          receiverPhone: data.receiverPhone,
          paymentMethod: data.paymentMethod,
          items: {
            create: orderItemsData
          }
        }
      })

      // 4. Clear the specific user's CartItem records
      const userCart = await tx.cart.findUnique({ where: { userId } })
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } })
      }

      return newOrder
    })

    // 5. Send Order Confirmation Email in the background
    if (session.user.email) {
      sendOrderConfirmationEmail(session.user.email, order.id, order.totalAmount.toNumber()).catch(console.error)
    }

    revalidatePath("/admin/orders")
    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("[CHECKOUT_ERROR]", error)
    return { error: error.message || "Có lỗi xảy ra khi xử lý đơn hàng." }
  }
}
