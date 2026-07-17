import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // 1. Robot Giáo Dục STEM
  const robotCategory = await prisma.category.create({
    data: {
      name: 'Robot Giáo Dục',
      description: 'Các sản phẩm robot thông minh giúp trẻ vừa học vừa chơi, làm quen với lập trình và công nghệ.',
    },
  })

  await prisma.product.createMany({
    data: [
      {
        title: 'Robot mBot Neo Thông Minh Lập Trình Scratch',
        slug: 'robot-mbot-neo-thong-minh-lap-trinh',
        description: 'Robot giáo dục mBot Neo với khả năng kết nối mạng, AI, IoT. Lập trình qua Scratch và Python, phù hợp cho học sinh từ 8 tuổi.',
        price: 3490000,
        type: 'ROBOT_STEM',
        sku: 'MBOT-NEO-01',
        inventoryCount: 50,
        imageUrl: 'https://images.unsplash.com/photo-1535378273068-9bb67d5beacd?q=80&w=800&auto=format&fit=crop',
        categoryId: robotCategory.id,
      },
      {
        title: 'Chó Robot Thông Minh AI Cảm Biến',
        slug: 'cho-robot-thong-minh-ai-cam-bien',
        description: 'Chó robot điện tử thông minh có thể nhận diện khuôn mặt, nghe lời và tương tác. Hỗ trợ học lập trình cơ bản.',
        price: 4990000,
        type: 'ROBOT_STEM',
        sku: 'ROBODOG-AI-02',
        inventoryCount: 20,
        imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=800&auto=format&fit=crop',
        categoryId: robotCategory.id,
      },
    ],
  })

  // 2. Kit Arduino & Mạch Điện Tử
  const kitCategory = await prisma.category.create({
    data: {
      name: 'Kit Arduino & Mạch',
      description: 'Bộ học tập và thực hành vi điều khiển Arduino, cảm biến dành cho người mới bắt đầu.',
    },
  })

  await prisma.product.create({
    data: {
      title: 'Bộ Tự Học Arduino Uno R3 Super Starter Kit',
      slug: 'bo-tu-hoc-arduino-uno-r3-starter-kit',
      description: 'Bộ kit cơ bản với hơn 200 linh kiện điện tử: mạch Arduino Uno R3, cảm biến siêu âm, động cơ servo, màn hình LCD và sách hướng dẫn chi tiết.',
      price: 650000,
      type: 'KIT_ARDUINO',
      sku: 'ARDUINO-KIT-01',
      inventoryCount: 150,
      imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89aadf0c84?q=80&w=800&auto=format&fit=crop',
      categoryId: kitCategory.id,
    },
  })

  // 3. Đồ Chơi Tư Duy Logic
  const logicCategory = await prisma.category.create({
    data: {
      name: 'Đồ Chơi Logic',
      description: 'Đồ chơi phát triển trí tuệ, kỹ năng tư duy không gian và giải quyết vấn đề.',
    },
  })

  await prisma.product.create({
    data: {
      title: 'Bộ Lắp Ráp Cơ Khí Chuyển Động 3D Gears',
      slug: 'bo-lap-rap-co-khi-chuyen-dong-3d-gears',
      description: 'Học nguyên lý truyền động bánh răng thông qua trò chơi lắp ráp gỗ 3D tự động. An toàn, kích thích tư duy kỹ thuật.',
      price: 250000,
      type: 'DO_CHOI_LOGIC',
      sku: 'LOGIC-GEARS-01',
      inventoryCount: 300,
      imageUrl: 'https://images.unsplash.com/photo-1558066524-7389a4437435?q=80&w=800&auto=format&fit=crop',
      categoryId: logicCategory.id,
    },
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
