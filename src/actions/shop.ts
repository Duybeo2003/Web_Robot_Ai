"use server";

import { prisma } from "@/lib/prisma";

import { AgeRange, PrimarySkill } from "@prisma/client";

export async function getGiftRecommendations(age: string, skill: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        ageRange: age as AgeRange,
        primarySkill: skill as PrimarySkill,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        imageUrl: true,
        isCombo: true,
        primarySkill: true,
      },
      take: 2,
    });

    // If less than 2 products found, try fetching fallback items (e.g. combos)
    if (products.length < 2) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          isCombo: true,
          id: { notIn: products.map((p) => p.id) },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          imageUrl: true,
          isCombo: true,
          primarySkill: true,
        },
        take: 2 - products.length,
      });
      products.push(...fallbackProducts);
    }

    return products.map((p) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      price: Number(p.price),
      image:
        p.imageUrl ||
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=200&auto=format&fit=crop",
      skillTag:
        p.primarySkill === "LOGIC"
          ? "Tư duy Logic"
          : p.primarySkill === "LANGUAGE"
            ? "Ngoại ngữ"
            : p.primarySkill === "MOTOR_SKILLS"
              ? "Vận động"
              : p.primarySkill === "EQ"
                ? "Phát triển EQ"
                : "Phát triển toàn diện",
      isCombo: p.isCombo,
    }));
  } catch (error) {
    console.error("Failed to fetch gift recommendations:", error);
    return [];
  }
}
