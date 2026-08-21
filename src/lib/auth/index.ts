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
  // requireAuth() roda em TODA navegação (layout + cada página), e sem isso
  // getSession() bate no Postgres em cada uma delas — mais uma ida ao banco
  // no caminho crítico de trocar de aba, além das queries de membership e da
  // própria página. Com cookie cache, a sessão fica num cookie assinado por
  // até 60s e getSession() só relê o banco quando esse cookie expira ou não
  // existe (login novo, cookie limpo etc.) — não muda logout (limpa o cookie
  // na hora); só atrasa em até 60s a aplicação de uma revogação forçada pelo
  // servidor (ex: admin remove o membro), aceitável pro tamanho desse time.
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
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
