import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = [
    'kiettuan22110@gmail.com',
    'tuandong5791@gmail.com',
    'nguyenquocduyth03@gmail.com'
  ];

  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: email.split('@')[0],
        role: 'ADMIN'
      }
    });
    console.log(`Đã cấp quyền ADMIN cho: ${user.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
