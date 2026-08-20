import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Esse projeto serve produção em vários domínios/apelidos da Vercel ao mesmo
  // tempo (crm-murillo97.vercel.app, crm-six-woad-38.vercel.app, meucrmvendas.vercel.app,
  // previews em *-murillo97.vercel.app, etc.) e ganha apelidos novos com frequência.
  // Sem isso, better-auth só confia na origem de BETTER_AUTH_URL e rejeita login
  // de qualquer outro domínio com "Invalid origin" (proteção CSRF). Libera
  // qualquer subdomínio *.vercel.app de uma vez, sem precisar editar de novo
  // cada vez que um apelido novo for criado no dashboard da Vercel.
  trustedOrigins: ["*.vercel.app", "http://localhost:3000"],
  // Aqui mapearíamos futuramente as sessões para o Next.js
});
