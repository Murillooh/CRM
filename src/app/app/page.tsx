import { requireAuth } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AppSwitcher() {
  const session = await requireAuth();

  // Find first membership
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true }
  });

  if (membership) {
    redirect(`/workspaces/${membership.workspace.slug}/deals`);
  }

  // Se não tem workspace, vamos criar um padrão para onboarding rápido local
  const workspace = await db.workspace.create({
    data: {
      name: "Meu CRM",
      slug: `meu-crm-${Date.now()}`,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER"
        }
      }
    }
  });

  await db.pipeline.create({
    data: {
      name: "Vendas",
      workspaceId: workspace.id,
      stages: {
        create: [
          { name: "Lead", order: 0, workspaceId: workspace.id },
          { name: "Contato Feito", order: 1, workspaceId: workspace.id },
          { name: "Proposta", order: 2, workspaceId: workspace.id },
          { name: "Negociação", order: 3, workspaceId: workspace.id }
        ]
      }
    }
  });

  redirect(`/workspaces/${workspace.slug}/deals`);
}
