import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { isCombo: false },
    take: 10,
  });

  if (products.length < 4) {
    console.log("Not enough products to create combos");
    return;
  }

  // Create Combo 1: Robot Hút Bụi + Đồ Chơi Logic
  const combo1Items = [products[0], products[1]];
  const combo1Price =
    Number(combo1Items[0].price) + Number(combo1Items[1].price);
  const combo1Discount = combo1Price * 0.8; // 20% off

  await prisma.product.create({
    data: {
      title: "Combo Siêu Trí Tuệ",
      slug: "combo-sieu-tri-tue-v2",
      description:
        "Sự kết hợp hoàn hảo giữa Robot thông minh và đồ chơi tư duy logic, giúp bé phát triển toàn diện.",
      price: combo1Discount,
      originalPrice: combo1Price,
      isCombo: true,
      imageUrl:
        "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      categoryId: products[0].categoryId,
      type: "ROBOT_STEM",
      comboItems: {
        create: [
          { productId: products[0].id, quantity: 1 },
          { productId: products[1].id, quantity: 1 },
        ],
      },
    },
  });

  // Create Combo 2
  const combo2Items = [products[2], products[3]];
  const combo2Price =
    Number(combo2Items[0].price) + Number(combo2Items[1].price);
  const combo2Discount = combo2Price * 0.75; // 25% off

  await prisma.product.create({
    data: {
      title: "Gói Khám Phá Khoa Học",
      slug: "goi-kham-pha-khoa-hoc",
      description:
        "Đưa bé vào thế giới khoa học diệu kỳ với 2 món đồ chơi lập trình và tư duy đột phá.",
      price: combo2Discount,
      originalPrice: combo2Price,
      isCombo: true,
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      categoryId: products[2].categoryId,
      type: "DO_CHOI_LOGIC",
      comboItems: {
        create: [
          { productId: products[2].id, quantity: 1 },
          { productId: products[3].id, quantity: 1 },
        ],
      },
    },
  });

  console.log("Seed Combos created!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
