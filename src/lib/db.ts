import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// CRM_DATABASE_URL vem da integração Neon (Vercel Storage), prefixada pra não
// colidir com o DATABASE_URL antigo do Supabase que ficou nas env vars.
// Fallback pra DATABASE_URL cobre dev local / quem ainda não migrou.
let connectionString = process.env.CRM_DATABASE_URL || process.env.DATABASE_URL;

// Suporte para o Prisma Postgres local (que usa prisma+postgres://)
// O pg-pool não entende esse protocolo, então extraímos a URL real do banco de dados (que roda em outra porta local) a partir da api_key em base64.
if (connectionString?.startsWith("prisma+postgres://")) {
  try {
    const urlObj = new URL(connectionString);
    const apiKeyBase64 = urlObj.searchParams.get("api_key");
    if (apiKeyBase64) {
      const decoded = JSON.parse(Buffer.from(apiKeyBase64, "base64").toString());
      if (decoded.databaseUrl) {
        connectionString = decoded.databaseUrl;
      }
    }
  } catch (e) {
    console.error("Erro ao decodificar a URL do Prisma Postgres", e);
  }
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
