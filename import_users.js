const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('old_users.json', 'utf8'));
  
  console.log('Importing users...');
  for (const user of data.users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: user.password,
          role: user.role,
          phoneNumber: user.phoneNumber
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: user.password,
          role: user.role,
          phoneNumber: user.phoneNumber
        }
      });
      console.log('Imported user:', user.email || user.phoneNumber);
    } catch (e) { console.error('Error user:', user.email, e.message); }
  }

  console.log('Users imported successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
