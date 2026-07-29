"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function updateOrderStatus(
  orderId: string,
  data: { status?: string; paymentStatus?: string },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order:", error);
    return { success: false, error: "Failed to update order" };
  }
}

export async function pushOrderToLogistics(
  orderId: string,
  provider: "GHN" | "GHTK",
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Order not found" };

    // MOCK: Giả lập đẩy đơn qua API của hãng vận chuyển
    console.log(`[LOGISTICS] Pushing order ${orderId} to ${provider}...`);

    // Fallback: nếu gọi API thật sẽ có đoạn fetch() ở đây
    const trackingCode = `${provider}-${Date.now().toString().slice(-6)}`;

    // Cập nhật trạng thái đơn hàng thành SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile/orders");
    return { success: true, trackingCode };
  } catch (error) {
    console.error(`Failed to push order to ${provider}:`, error);
    return { success: false, error: `Failed to push order to ${provider}` };
  }
}

export async function upsertProduct(data: any, id?: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const productData = {
    title: data.title,
    description: data.description,
    price: data.price,
    type: data.type,
    supplyType: data.supplyType || "IN_HOUSE",
    inventoryCount: data.inventoryCount,
    imageUrl: data.imageUrl,
    originalPrice: data.originalPrice || null,
    flashSaleActive: data.flashSaleActive || false,
    flashSaleEndDate:
      data.flashSaleActive && data.flashSaleEndDate
        ? new Date(data.flashSaleEndDate)
        : null,
    flashSaleStock: data.flashSaleActive ? data.flashSaleStock : 0,
    ageRange: data.ageRange || null,
    primarySkill: data.primarySkill || null,
    educationalGoal: data.educationalGoal || null,
    isCombo: data.isCombo || false,
    externalAffiliateLink: data.externalAffiliateLink || null,
    commissionRate: data.commissionRate ? Number(data.commissionRate) : null,
    depositPercent: data.depositPercent ? Number(data.depositPercent) : null,
    estimatedArrivalDate: data.estimatedArrivalDate ? new Date(data.estimatedArrivalDate) : null,
    ...(data.categoryId ? { categoryId: data.categoryId } : {}),
  };

  try {
    if (id) {
      // 1. Update product base info
      await prisma.product.update({
        where: { id },
        data: productData,
      });

      // 2. Handle Combo Items
      if (data.isCombo && data.comboItems) {
        // Delete old items
        await prisma.comboItem.deleteMany({ where: { comboId: id } });

        // Insert new items
        if (data.comboItems.length > 0) {
          await prisma.comboItem.createMany({
            data: data.comboItems.map((c: any) => ({
              comboId: id,
              productId: c.productId,
              quantity: c.quantity || 1,
            })),
          });
        }
      } else if (!data.isCombo) {
        await prisma.comboItem.deleteMany({ where: { comboId: id } });
      }

      // 3. Handle Variants
      if (data.variants && data.variants.length > 0) {
        // Delete old variants that are not in the new list (if they don't have an ID, or if we just want to recreate them)
        // Simplest approach: Delete all and recreate, or update existing and create new.
        // Let's delete all existing variants for this product and recreate them to avoid orphans.
        // Note: This might break CartItem/OrderItem links if they rely on variantId!
        // A safer approach: Update existing, create new, delete missing.
        const existingVariants = await prisma.productVariant.findMany({ where: { productId: id } });
        const incomingIds = data.variants.map((v: any) => v.id).filter(Boolean);
        
        // Delete variants not in the incoming list
        const variantsToDelete = existingVariants.filter(ev => !incomingIds.includes(ev.id));
        if (variantsToDelete.length > 0) {
          await prisma.productVariant.deleteMany({
            where: { id: { in: variantsToDelete.map(v => v.id) } }
          });
        }

        // Upsert incoming variants
        for (const variant of data.variants) {
          if (variant.id) {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                attributes: variant.attributes,
                price: variant.price,
                originalPrice: variant.originalPrice || null,
                inventoryCount: variant.inventoryCount,
                sku: variant.sku || null,
                imageUrl: variant.imageUrl || null,
              }
            });
          } else {
            await prisma.productVariant.create({
              data: {
                productId: id,
                attributes: variant.attributes,
                price: variant.price,
                originalPrice: variant.originalPrice || null,
                inventoryCount: variant.inventoryCount,
                sku: variant.sku || null,
                imageUrl: variant.imageUrl || null,
              }
            });
          }
        }
      } else {
        // If no variants provided, maybe create a default one? Or leave it empty.
      }
    } else {
      const slug =
        data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
        "-" +
        Date.now().toString().slice(-4);
      const newProduct = await prisma.product.create({
        data: {
          ...productData,
          slug,
        },
      });

      // Handle Combo Items for new product
      if (data.isCombo && data.comboItems && data.comboItems.length > 0) {
        await prisma.comboItem.createMany({
          data: data.comboItems.map((c: any) => ({
            comboId: newProduct.id,
            productId: c.productId,
            quantity: c.quantity || 1,
          })),
        });
      }
      
      // Handle Variants for new product
      if (data.variants && data.variants.length > 0) {
        await prisma.productVariant.createMany({
          data: data.variants.map((v: any) => ({
            productId: newProduct.id,
            attributes: v.attributes,
            price: v.price,
            originalPrice: v.originalPrice || null,
            inventoryCount: v.inventoryCount,
            sku: v.sku || null,
            imageUrl: v.imageUrl || null,
          }))
        });
      }
    }
    revalidatePath("/admin/products");
    revalidatePath("/"); // revalidate store
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert product:", error);
    return { success: false, error: "Lỗi lưu sản phẩm" };
  }
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN" | "STORE_MANAGER") {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  // Prevent changing own role
  if (session.user.id === userId) {
    return { success: false, error: "Cannot change your own role" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  if (session.user.id === userId) {
    return { success: false, error: "Cannot delete yourself" };
  }

  try {
    // We use soft delete based on schema or hard delete? Schema has `deletedAt`. Let's soft delete.
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function upsertCategory(
  data: { name: string; description?: string },
  id?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    if (id) {
      await prisma.category.update({
        where: { id },
        data,
      });
    } else {
      await prisma.category.create({
        data,
      });
    }
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert category:", error);
    return { success: false, error: "Failed to save category" };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    await prisma.category.delete({
      where: { id },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return {
      success: false,
      error:
        "Failed to delete category. Lỗi: Có thể do danh mục này đang chứa sản phẩm.",
    };
  }
}

export async function upsertCoupon(
  data: {
    code: string;
    discountPercent: number;
    usageLimit?: number | null;
    expiresAt?: Date | null;
  },
  id?: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    if (id) {
      await prisma.coupon.update({
        where: { id },
        data,
      });
    } else {
      await prisma.coupon.create({
        data,
      });
    }
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert coupon:", error);
    return {
      success: false,
      error: "Failed to save coupon. Mã có thể đã tồn tại.",
    };
  }
}

export async function deleteCoupon(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    await prisma.coupon.delete({
      where: { id },
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete coupon:", error);
    return { success: false, error: "Failed to delete coupon." };
  }
}

export async function deleteReview(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    await prisma.review.delete({
      where: { id },
    });
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete review:", error);
    return { success: false, error: "Failed to delete review." };
  }
}

export async function getSettings() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    return { success: true, data: settingsMap };
  } catch (error) {
    console.error("Failed to get settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSettings(data: Record<string, string>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    const promises = Object.entries(data).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await prisma.$transaction(promises);
    revalidatePath("/admin/settings");
    revalidatePath("/"); // Revalidate storefront to reflect new settings
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
