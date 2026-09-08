"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function submitReview(rawProductId: string, formData: FormData) {
  try {
    const user = await requireUser();
    const productId = z.string().min(1).max(191).parse(rawProductId);
    const input = z.object({
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().trim().min(5).max(2_000),
    }).parse({ rating: formData.get("rating"), comment: formData.get("comment") });

    const hasPurchased = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: user.id, status: "COMPLETED" } },
      select: { id: true },
    });
    if (!hasPurchased) {
      return { success: false, error: "Bạn chỉ có thể đánh giá sản phẩm đã nhận." };
    }

    await prisma.review.create({
      data: { ...input, userId: user.id, productId, status: "PENDING" },
    });
    revalidatePath("/shop/[slug]", "page");
    return { success: true };
  } catch (error) {
    console.error("[SUBMIT_REVIEW_ERROR]", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Bạn đã đánh giá sản phẩm này." };
    }
    return { success: false, error: "Không thể gửi đánh giá." };
  }
}
