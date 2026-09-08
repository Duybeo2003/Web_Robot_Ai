import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyError } from "@/lib/read-json-body";
import { getRequestFingerprint } from "@/lib/request-fingerprint";

const cartSyncSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(191),
        variantId: z.string().min(1).max(191).optional(),
        quantity: z.number().int().min(1).max(99),
        price: z.number().finite().nonnegative().max(100_000_000_000),
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
    const session = await auth();
    const actorKey = session?.user?.id || (await getRequestFingerprint());
    const rateLimit = await checkRateLimit(`rl:cart-sync:${actorKey}`, 60, 60, {
      failClosed: true,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many cart updates" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    const parsed = cartSyncSchema.safeParse(await readJsonBody(request, 100_000));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }
    const items = parsed.data.items;
    const productIds = [...new Set(items.map((item) => item.id))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        imageUrl: true,
        supplyType: true,
        depositPercent: true,
        inventoryCount: true,
        variants: {
          select: {
            id: true,
            price: true,
            imageUrl: true,
            inventoryCount: true,
            attributes: true,
          },
        },
      },
    });

    let adjusted = products.length !== productIds.length;
    const canonicalItems = items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      if (!product || product.supplyType === "AFFILIATE_SELL") {
        adjusted = true;
        return [];
      }

      const variant = item.variantId
        ? product.variants.find((candidate) => candidate.id === item.variantId)
        : undefined;
      if (
        (product.variants.length > 0 && !variant) ||
        (product.variants.length === 0 && item.variantId)
      ) {
        adjusted = true;
        return [];
      }

      const available = variant?.inventoryCount ?? product.inventoryCount;
      if (available <= 0) {
        adjusted = true;
        return [];
      }
      const quantity = Math.min(99, available, item.quantity);
      const price = Number(variant?.price ?? product.price);
      if (quantity !== item.quantity || price !== item.price) adjusted = true;

      const variantAttributes =
        variant &&
        variant.attributes &&
        typeof variant.attributes === "object" &&
        !Array.isArray(variant.attributes)
          ? Object.fromEntries(
              Object.entries(variant.attributes).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string",
              ),
            )
          : undefined;

      return [
        {
          id: product.id,
          variantId: variant?.id,
          variantAttributes,
          title: product.title,
          slug: product.slug,
          price,
          quantity,
          imageUrl: variant?.imageUrl || product.imageUrl || undefined,
          inventoryCount: available,
          supplyType: product.supplyType,
          depositPercent: product.depositPercent ?? undefined,
        },
      ];
    });

    if (session?.user?.id) {
      await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
          where: { userId: session.user.id },
          update: {},
          create: { userId: session.user.id },
        });
        const selectionKeys = canonicalItems.map(
          (item) => `${item.id}:${item.variantId || "base"}`,
        );
        await tx.cartItem.deleteMany({
          where: selectionKeys.length
            ? { cartId: cart.id, selectionKey: { notIn: selectionKeys } }
            : { cartId: cart.id },
        });
        for (const item of canonicalItems) {
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
    }

    return NextResponse.json({ success: true, items: canonicalItems, adjusted });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[CART_SYNC_ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
