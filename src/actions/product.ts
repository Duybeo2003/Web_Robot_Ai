"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductType } from "@prisma/client";
import { requireRole } from "@/lib/authz";

export async function createProduct(formData: FormData) {
  await requireRole("ADMIN", "STORE_MANAGER");
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const inventoryCount = parseInt(
    (formData.get("inventoryCount") as string) || "0",
  );
  const type = formData.get("type") as ProductType;

  if (!title || isNaN(price) || !type) {
    throw new Error("Missing required fields");
  }

  // Generate slug from title
  const slug =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
    "-" +
    Date.now();

  await prisma.product.create({
    data: {
      title,
      slug,
      description,
      price,
      inventoryCount,
      type,
      // For demo, we just use a placeholder image if none uploaded
      imageUrl: "/images/products/robot_giao_duc_5g.jpg",
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  try {
    await requireRole("ADMIN");
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          inventoryCount: 0,
          flashSaleActive: false,
          flashSaleEndDate: null,
          flashSaleStock: null,
        },
      }),
    ]);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function removeFlashSale(id: string) {
  try {
    await requireRole("ADMIN", "STORE_MANAGER");
    await prisma.product.update({
      where: { id },
      data: {
        flashSaleActive: false,
        flashSaleEndDate: null,
        flashSaleStock: null,
      },
    });
    revalidatePath("/admin/flash-sales");
    revalidatePath("/admin/products");
    revalidatePath("/admin/combos");
    revalidatePath("/shop");
  } catch (error) {
    console.error("Error removing flash sale:", error);
  }
}
