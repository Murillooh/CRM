import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success! Found user:", user);
  } catch (err) {
    console.error("Failed to query DB with adapter:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
