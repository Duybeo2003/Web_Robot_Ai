const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('old_data.json', 'utf8'));
  
  console.log('Importing categories...');
  for (const cat of data.categories) {
    try {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, description: cat.description },
        create: { id: cat.id, name: cat.name, description: cat.description }
      });
    } catch (e) { console.error('Error category:', e.message); }
  }

  console.log('Importing products...');
  for (const prod of data.products) {
    try {
      await prisma.product.upsert({
        where: { id: prod.id },
        update: {
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          price: Number(prod.price),
          type: prod.type,
          sku: prod.sku,
          inventoryCount: prod.inventoryCount,
          imageUrl: prod.imageUrl,
          categoryId: prod.categoryId,
          originalPrice: prod.originalPrice ? Number(prod.originalPrice) : null,
          flashSaleActive: !!prod.flashSaleActive,
          flashSaleEndDate: prod.flashSaleEndDate ? new Date(prod.flashSaleEndDate) : null,
          flashSaleStock: prod.flashSaleStock || 0,
        },
        create: {
          id: prod.id,
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          price: Number(prod.price),
          type: prod.type,
          sku: prod.sku,
          inventoryCount: prod.inventoryCount,
          imageUrl: prod.imageUrl,
          categoryId: prod.categoryId,
          originalPrice: prod.originalPrice ? Number(prod.originalPrice) : null,
          flashSaleActive: !!prod.flashSaleActive,
          flashSaleEndDate: prod.flashSaleEndDate ? new Date(prod.flashSaleEndDate) : null,
          flashSaleStock: prod.flashSaleStock || 0,
        }
      });
    } catch (e) { console.error('Error product:', prod.title, e.message); }
  }

  console.log('Data imported successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
