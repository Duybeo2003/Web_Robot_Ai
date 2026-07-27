import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
  const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'));
  
  await prisma.comboItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  if (data.categories && data.categories.length > 0) {
    await prisma.category.createMany({ data: data.categories });
  }
  if (data.products && data.products.length > 0) {
    await prisma.product.createMany({ data: data.products });
  }
  if (data.comboItems && data.comboItems.length > 0) {
    await prisma.comboItem.createMany({ data: data.comboItems });
  }
  console.log('Import successful!');
}
main().finally(() => prisma.$disconnect());
