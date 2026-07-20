"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateSlug } from "@/lib/utils"

export async function getArticles(publishedOnly = false) {
  try {
    const articles = await prisma.article.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, image: true } }
      }
    })
    return { success: true, data: articles }
  } catch (error: any) {
    return { error: "Không thể lấy danh sách bài viết." }
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, image: true } }
      }
    })
    if (!article) return { error: "Không tìm thấy bài viết." }
    return { success: true, data: article }
  } catch (error: any) {
    return { error: "Đã xảy ra lỗi." }
  }
}

export async function createArticle(data: {
  title: string
  content: string
  thumbnail?: string
  tags?: string
  published: boolean
}) {
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { error: "Bạn không có quyền thực hiện chức năng này." }
  }

  try {
    let slug = generateSlug(data.title)
    // Ensure slug is unique
    const existing = await prisma.article.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        thumbnail: data.thumbnail,
        tags: data.tags,
        published: data.published,
        authorId: session.user.id
      }
    })

    revalidatePath("/admin/articles")
    revalidatePath("/giao-duc")
    return { success: true, data: article }
  } catch (error: any) {
    return { error: "Không thể tạo bài viết." }
  }
}

export async function deleteArticle(id: string) {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.article.delete({ where: { id } })
    revalidatePath("/admin/articles")
    revalidatePath("/giao-duc")
    return { success: true }
  } catch (error: any) {
    return { error: "Không thể xóa bài viết." }
  }
}
