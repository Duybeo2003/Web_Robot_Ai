import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding promotional data...')

  const products = await prisma.product.findMany()

  for (const product of products) {
    const originalPrice = Number(product.price) * 1.25 // +25% markup to show 20% discount
    const endDate = new Date()
    endDate.setHours(endDate.getHours() + 12) // ends in 12 hours
    const randomStock = Math.floor(Math.random() * 10) + 1 // 1-10 items left

    await prisma.product.update({
      where: { id: product.id },
      data: {
        originalPrice: originalPrice,
        flashSaleActive: true,
        flashSaleEndDate: endDate,
        flashSaleStock: randomStock,
      }
    })
    
    console.log(`Updated product: ${product.title} (Stock: ${randomStock})`)
  }

  console.log('Successfully seeded promotional data for all products.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
