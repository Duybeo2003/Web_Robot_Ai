import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const cartSyncSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(191),
        variantId: z.string().min(1).max(191).optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100)
    .refine(
      (items) =>
        new Set(items.map((item) => `${item.id}:${item.variantId || "base"}`)).size ===
        items.length,
      "Duplicate cart item",
    ),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = cartSyncSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }
    const items = parsed.data.items;
    const productIds = [...new Set(items.map((item) => item.id))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, variants: { select: { id: true } } },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Product is unavailable" }, { status: 409 });
    }
    for (const item of items) {
      if (!item.variantId) continue;
      const product = products.find((candidate) => candidate.id === item.id)!;
      if (!product.variants.some((variant) => variant.id === item.variantId)) {
        return NextResponse.json({ error: "Invalid product variant" }, { status: 409 });
      }
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      const selectionKeys = items.map(
        (item) => `${item.id}:${item.variantId || "base"}`,
      );
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id, selectionKey: { notIn: selectionKeys } },
      });
      for (const item of items) {
        const selectionKey = `${item.id}:${item.variantId || "base"}`;
        await tx.cartItem.upsert({
          where: { cartId_selectionKey: { cartId: cart.id, selectionKey } },
          update: { quantity: item.quantity },
          create: {
            cartId: cart.id,
            productId: item.id,
            variantId: item.variantId,
            selectionKey,
            quantity: item.quantity,
          },
        });
      }
    });

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                imageUrl: true,
                inventoryCount: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error("[CART_SYNC_ERROR]", error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
