import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./index";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Valida a sessão ativa. Utilizar em Server Components / Server Actions
 * onde apenas estar logado importa (ex: Perfil, Onboarding).
 *
 * Envolto em `cache()`: layout.tsx e a página filha chamam isso (direta ou
 * indiretamente via requireWorkspaceAccess) dentro do MESMO request — sem
 * cache() isso significa 2x a ida-e-volta ao banco (sessão + membership) só
 * pra abrir uma página, exatamente o tipo de lentidão já diagnosticada nessa
 * sessão. `cache()` deduplica automaticamente por request, não por instância.
 */
export const requireAuth = cache(async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session;
});

/**
 * Valida a sessão e verifica se o usuário possui acesso ao Workspace solicitado.
 * Retorna o usuário, o workspace e a Role (papel). Também cacheado por request
 * (dedupe por workspaceSlug) — ver nota acima em requireAuth.
 */
export const requireWorkspaceAccess = cache(async function requireWorkspaceAccess(workspaceSlug: string) {
  const session = await requireAuth();

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      workspace: {
        slug: workspaceSlug,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    // Redireciona para um app switcher caso ele não pertença ao workspace 
    // ou se o workspace não existir.
    redirect("/app"); 
  }

  return {
    user: session.user,
    workspace: membership.workspace,
    role: membership.role,
  };
});
