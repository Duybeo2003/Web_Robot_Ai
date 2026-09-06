import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  if (!fs.existsSync('backup.json')) {
    console.error('Không tìm thấy file backup.json');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));
  console.log('Đang xóa dữ liệu cũ để tránh trùng lặp...');

  await prisma.comboItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  if (data.categories && data.categories.length > 0) {
    const categoriesWithSlugs = data.categories.map((c: any) => ({
      ...c,
      slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));
    await prisma.category.createMany({ data: categoriesWithSlugs });
    console.log('Đã phục hồi Danh mục');
  }

  if (data.products && data.products.length > 0) {
    await prisma.product.createMany({ data: data.products });
    console.log('Đã phục hồi Sản phẩm');
  }

  if (data.comboItems && data.comboItems.length > 0) {
    await prisma.comboItem.createMany({ data: data.comboItems });
    console.log('Đã phục hồi Combo');
  }

  console.log('Quá trình phục hồi hoàn tất!');
}

main().finally(() => prisma.$disconnect());
