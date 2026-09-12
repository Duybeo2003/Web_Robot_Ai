"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { recordAudit } from "@/lib/audit";
import { isAllowedImageUrl } from "@/lib/media-url";

const articleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(20).max(500_000),
  thumbnail: z
    .union([
      z.literal(""),
      z.string().trim().max(2_000).refine(isAllowedImageUrl, "Ảnh đại diện không hợp lệ."),
    ])
    .optional(),
  tags: z.string().trim().max(500).optional(),
  published: z.boolean(),
});

export async function getArticles(publishedOnly = true) {
  try {
    if (!publishedOnly) await requireRole("ADMIN", "EDITOR");
    const articles = await prisma.article.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, image: true } } },
    });
    return { success: true, data: articles };
  } catch {
    return { success: false, error: "Không thể lấy danh sách bài viết." };
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const safeSlug = z.string().min(1).max(191).parse(slug);
    const article = await prisma.article.findUnique({
      where: { slug: safeSlug },
      include: { author: { select: { name: true, image: true } } },
    });
    if (!article) return { success: false, error: "Không tìm thấy bài viết." };
    if (!article.published) await requireRole("ADMIN", "EDITOR");
    return { success: true, data: article };
  } catch {
    return { success: false, error: "Không tìm thấy bài viết." };
  }
}

export async function createArticle(input: unknown) {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const data = articleSchema.parse(input);
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    if (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    const article = await prisma.article.create({
      data: { ...data, slug, authorId: user.id },
    });
    await recordAudit({
      actorId: user.id,
      action: "article.create",
      model: "Article",
      recordId: article.id,
      after: { title: article.title, published: article.published },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/giao-duc");
    return { success: true, data: article };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tạo bài viết.",
    };
  }
}

export async function updateArticle(id: string, input: unknown) {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const data = articleSchema.parse(input);
    const article = await prisma.article.update({
      where: { id: z.string().min(1).max(191).parse(id) },
      data,
    });
    await recordAudit({
      actorId: user.id,
      action: "article.update",
      model: "Article",
      recordId: article.id,
      after: { title: article.title, published: article.published },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/giao-duc");
    revalidatePath(`/giao-duc/${article.slug}`);
    return { success: true, data: article };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể cập nhật bài viết.",
    };
  }
}

export async function deleteArticle(id: string) {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const article = await prisma.article.delete({
      where: { id: z.string().min(1).max(191).parse(id) },
    });
    await recordAudit({
      actorId: user.id,
      action: "article.delete",
      model: "Article",
      recordId: article.id,
      before: { title: article.title, published: article.published },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/giao-duc");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa bài viết.",
    };
  }
}
