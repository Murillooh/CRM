import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success! Found user:", user);
  } catch (err) {
    console.error("Failed to query DB:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
