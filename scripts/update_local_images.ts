import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cập nhật lại ảnh local cho các sản phẩm để tránh lag...");
  
  // Cập nhật Robot STEM
  await prisma.product.updateMany({
    where: { type: "ROBOT_STEM" },
    data: { imageUrl: "/images/products/robot_giao_duc_5g.jpg" }
  });

  // Cập nhật KIT ARDUINO
  await prisma.product.updateMany({
    where: { type: "KIT_ARDUINO" },
    data: { imageUrl: "/images/products/arduino_kit.jpg" }
  });

  // Cập nhật Đồ chơi Logic
  await prisma.product.updateMany({
    where: { type: "DO_CHOI_LOGIC" },
    data: { imageUrl: "/images/products/logic_toy.jpg" }
  });

  console.log("Hoàn tất cập nhật ảnh local!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
