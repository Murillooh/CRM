import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// extract standard postgres URL if it's a Prisma proxy URL
let url = process.env.DATABASE_URL || "";
if (url.startsWith("prisma+postgres://")) {
  const urlObj = new URL(url);
  const apiKeyBase64 = urlObj.searchParams.get("api_key");
  if (apiKeyBase64) {
    try {
      const decoded = JSON.parse(Buffer.from(apiKeyBase64, "base64").toString());
      if (decoded.databaseUrl) {
        url = decoded.databaseUrl;
        console.log("Using underlying postgres URL:", url);
      }
    } catch (e) {
      console.error("Failed to decode api_key");
    }
  }
}

const pool = new Pool({ connectionString: url });
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
