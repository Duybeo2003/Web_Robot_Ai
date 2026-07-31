/* eslint-disable */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Updating products with educational classifications...");

  const products = await prisma.product.findMany();

  // Update existing products with diverse combinations of Age & Skill.
  const categories = [
    { age: "AGE_3_5", skill: "EQ", name: "Robot Nhận Diện Cảm Xúc Thông Minh" },
    {
      age: "AGE_3_5",
      skill: "MOTOR_SKILLS",
      name: "Bộ Lắp Ráp Rèn Vận Động Tinh",
    },
    {
      age: "AGE_6_8",
      skill: "LANGUAGE",
      name: "Robot Giao Tiếp & Học Tiếng Anh",
    },
    {
      age: "AGE_6_8",
      skill: "LOGIC",
      name: "Robot Giải Toán & Lập Trình Cơ Bản",
    },
    { age: "AGE_9_12", skill: "LOGIC", name: "Xe Tank Robot Lập Trình Python" },
    {
      age: "AGE_9_12",
      skill: "MOTOR_SKILLS",
      name: "Cánh Tay Robot Công Nghiệp Mini",
    },
    { age: "AGE_6_8", skill: "EQ", name: "Robot Thú Cưng Nuôi Dưỡng EQ" },
    {
      age: "AGE_3_5",
      skill: "LANGUAGE",
      name: "Bút Chấm Đọc & Robot Song Ngữ",
    },
  ];

  for (let i = 0; i < Math.min(products.length, categories.length); i++) {
    const c = categories[i];
    const p = products[i];
    await prisma.product.update({
      where: { id: p.id },
      data: {
        title: c.name,
        ageRange: c.age,
        primarySkill: c.skill,
      },
    });
    console.log(`Updated "${p.title}" -> "${c.name}" (${c.age} - ${c.skill})`);
  }

  // Also make sure combos have valid classifications so they act as fallback
  const combos = products.filter((p: any) => p.isCombo);
  for (let i = 0; i < combos.length; i++) {
    await prisma.product.update({
      where: { id: combos[i].id },
      data: {
        ageRange: "AGE_6_8",
        primarySkill: "LANGUAGE", // E.g. make combos default to language 6-8
      },
    });
  }

  console.log("Database update complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

