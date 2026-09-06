import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing NULL slugs in Product table...');
  const result = await prisma.$executeRaw`UPDATE Product SET slug = CONCAT('product-', id) WHERE slug IS NULL`;
  console.log(`Fixed ${result} products with NULL slug.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
