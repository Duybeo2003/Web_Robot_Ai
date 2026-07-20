import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { slug: true, updatedAt: true }
  })

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch all published articles
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true }
  })

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/giao-duc/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Add static routes
  const staticRoutes = [
    '',
    '/shop',
    '/giao-duc',
    '/huong-dan',
    '/bao-hanh',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return [...staticRoutes, ...productUrls, ...articleUrls]
}
