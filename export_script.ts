import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const comboItems = await prisma.comboItem.findMany();
  fs.writeFileSync('backup.json', JSON.stringify({ categories, products, comboItems }, null, 2));
  console.log('Exported');
}
main().finally(() => prisma.$disconnect());
