"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ProductType } from "@prisma/client"

export async function createProduct(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const price = parseFloat(formData.get("price") as string)
  const inventoryCount = parseInt(formData.get("inventoryCount") as string || "0")
  const type = formData.get("type") as ProductType
  
  if (!title || isNaN(price) || !type) {
    throw new Error("Missing required fields")
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    + "-" + Date.now()

  await prisma.product.create({
    data: {
      title,
      slug,
      description,
      price,
      inventoryCount,
      type,
      // For demo, we just use a placeholder image if none uploaded
      imageUrl: "/images/products/robot_giao_duc_5g.jpg"
    }
  })

  revalidatePath("/admin/products")
  revalidatePath("/shop")
  redirect("/admin/products")
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    })
    revalidatePath("/admin/products")
    revalidatePath("/shop")
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}
