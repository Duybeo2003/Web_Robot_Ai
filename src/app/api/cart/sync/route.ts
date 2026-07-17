import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new NextResponse("Invalid items array", { status: 400 });
    }

    const userId = session.user.id;

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Merge logic
    for (const localItem of items) {
      const existingDbItem = cart.items.find(
        (i) => i.productId === localItem.id
      );

      if (existingDbItem) {
        await prisma.cartItem.update({
          where: { id: existingDbItem.id },
          data: { quantity: localItem.quantity }, // Update DB with local quantity
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: localItem.id,
            quantity: localItem.quantity,
          },
        });
      }
    }

    // Return the updated DB cart items so the local store can align
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      },
    });

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error("[CART_SYNC]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
