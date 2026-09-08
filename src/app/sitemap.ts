import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  const [products, articles] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  const staticPaths = [
    "",
    "/shop",
    "/giao-duc",
    "/gioi-thieu",
    "/lien-he",
    "/bao-hanh",
    "/dieu-khoan-su-dung",
    "/chinh-sach-van-chuyen",
    "/chinh-sach-thanh-toan",
    "/chinh-sach-doi-tra",
    "/chinh-sach-bao-mat",
  ];

  return [
    ...staticPaths.map((path, index) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: (index < 2 ? "daily" : "monthly") as "daily" | "monthly",
      priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.6,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/shop/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/giao-duc/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
