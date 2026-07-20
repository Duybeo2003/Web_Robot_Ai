"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createInventoryTransaction(data: {
  productId: string
  type: "IN" | "OUT"
  quantity: number
  costPrice?: number
  reference?: string
  note?: string
}) {
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "STORE_MANAGER")) {
    return { error: "Bạn không có quyền thực hiện chức năng này." }
  }

  if (data.quantity <= 0) {
    return { error: "Số lượng phải lớn hơn 0." }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      })

      if (!product) {
        throw new Error("Sản phẩm không tồn tại.")
      }

      if (data.type === "OUT" && product.inventoryCount < data.quantity) {
        throw new Error("Số lượng tồn kho không đủ để xuất.")
      }

      // Create transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          costPrice: data.costPrice,
          reference: data.reference,
          note: data.note,
          userId: session.user.id
        }
      })

      // Update product inventory count
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: {
          inventoryCount: {
            [data.type === "IN" ? "increment" : "decrement"]: data.quantity
          }
        }
      })

      return { transaction, updatedProduct }
    })

    revalidatePath("/admin/inventory")
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${data.productId}`)
    
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[INVENTORY_ERROR]", error)
    return { error: error.message || "Có lỗi xảy ra khi cập nhật kho." }
  }
}

export async function getLowStockProducts(threshold = 10) {
  const session = await auth()
  if (!session?.user?.id || session.user.role === "USER") {
    return { error: "Unauthorized" }
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        inventoryCount: {
          lte: threshold
        },
        deletedAt: null
      },
      orderBy: {
        inventoryCount: 'asc'
      },
      select: {
        id: true,
        title: true,
        sku: true,
        inventoryCount: true,
        imageUrl: true,
      }
    })

    return { success: true, data: products }
  } catch (error: any) {
    return { error: "Failed to fetch low stock products." }
  }
}
