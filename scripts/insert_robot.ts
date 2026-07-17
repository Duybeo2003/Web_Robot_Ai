import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.create({
    data: {
      title: "Robot AI Giáo Dục Sớm Thông Minh Kèm Màn Hình 5G",
      slug: "robot-ai-giao-duc-som-thong-minh-5g",
      price: 1590000,
      description: "Robot thông minh hỗ trợ giáo dục sớm cho bé. Tích hợp màn hình xem video, gọi điện 5G, app học tập. Giúp trẻ vừa học vừa chơi, phát triển tư duy logic và kỹ năng sống. Hỗ trợ đàm thoại thông minh, giám sát trẻ từ xa. Thiết kế an toàn, ngộ nghĩnh cho bé. Giao diện hoàn toàn bằng tiếng Việt.",
      imageUrl: "/images/products/robot_giao_duc_5g.jpg",
      type: "ROBOT_STEM",
      inventoryCount: 50
    }
  });

  console.log("Created product:", product.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
