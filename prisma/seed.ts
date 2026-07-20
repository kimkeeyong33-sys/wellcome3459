import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = ["산업기계", "전자부품", "원자재/화학", "포장재", "사무/OA기기", "재고/반품자산"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`Seeded ${categories.length} categories.`);

  const adminEmail = "admin@example.com";
  const adminPassword = "admin1234";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        name: "관리자",
        role: "ADMIN",
      },
    });
    console.log(`Seeded admin account: ${adminEmail} / ${adminPassword} (change this in production)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
