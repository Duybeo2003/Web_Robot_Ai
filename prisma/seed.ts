import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // 1. Dinh dưỡng tiện lợi (Convenient Nutrition)
  const nutritionCategory = await prisma.category.create({
    data: {
      name: 'Dinh dưỡng tiện lợi',
      description: 'Các sản phẩm dinh dưỡng tối ưu hóa sức khoẻ và thời gian cho cuộc sống bận rộn.',
    },
  })

  await prisma.product.createMany({
    data: [
      {
        title: 'Bữa ăn thay thế tiện lợi (Vị Cacao)',
        slug: 'bua-an-thay-the-tien-loi-cacao',
        description: 'Bữa ăn cân bằng hoàn hảo cung cấp 20g protein, 27 loại vitamin và khoáng chất, chất xơ chỉ trong 1 phút chuẩn bị. Hoàn hảo cho bữa sáng hoặc bữa trưa bận rộn.',
        price: 250000,
        type: 'NUTRITION',
        sku: 'NUTRI-MEAL-COCOA-01',
        inventoryCount: 100,
        imageUrl: 'https://images.unsplash.com/photo-1556910113-1f0e49ccfae1?q=80&w=800&auto=format&fit=crop', // Minimalist jar/packaging on stone
        categoryId: nutritionCategory.id,
      },
      {
        title: 'Thanh hạt dinh dưỡng năng lượng cao',
        slug: 'thanh-hat-dinh-duong-nang-luong-cao',
        description: 'Thanh năng lượng 100% tự nhiên từ các loại hạt cao cấp (macca, hạnh nhân, óc chó) và mật ong. Không đường tinh luyện, bổ sung năng lượng tức thì trước khi làm việc hoặc tập luyện.',
        price: 35000,
        type: 'NUTRITION',
        sku: 'NUTRI-BAR-NUT-01',
        inventoryCount: 500,
        imageUrl: 'https://images.unsplash.com/photo-1615486511484-92e172e2ae92?q=80&w=800&auto=format&fit=crop', // Elegant nutrition bar/package
        categoryId: nutritionCategory.id,
      },
    ],
  })

  // 2. Thiết bị công nghệ thông minh (Smart Tech Devices)
  const techCategory = await prisma.category.create({
    data: {
      name: 'Thiết bị công nghệ thông minh',
      description: 'Công nghệ hỗ trợ giáo dục và cuộc sống.',
    },
  })

  await prisma.product.create({
    data: {
      title: 'Robot AI Desktop Assistant',
      slug: 'robot-ai-desktop-assistant',
      description: 'Robot thông minh để bàn tích hợp AI tiên tiến. Hỗ trợ nhắc nhở học tập, quản lý công việc Pomodoro, tương tác giọng nói tự nhiên và hiển thị cảm xúc sinh động trên màn hình LCD 1.54". Được trang bị vi điều khiển ESP32-S3 mạnh mẽ.',
      price: 1500000,
      type: 'TECH_DEVICE',
      sku: 'ROBO-AI-DESK-01',
      inventoryCount: 50,
      imageUrl: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?q=80&w=800&auto=format&fit=crop', // Sleek tech/robot on clean desk
      categoryId: techCategory.id,
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
