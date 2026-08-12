"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

/**
 * Views/filtros salvos por usuário (item 7 da auditoria de UX) — pessoal, não
 * compartilhado com o resto do workspace. `query` guarda o mesmo shape dos
 * searchParams da página de destino (hoje só `{ q }`, mas o campo é livre
 * pra crescer sem migração nova).
 */
export async function createSavedView(
  workspaceSlug: string,
  entityType: string,
  name: string,
  query: { q?: string }
) {
  const { user, workspace } = await requireWorkspaceAccess(workspaceSlug);

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Dê um nome pra essa view.");
  }

  await db.savedView.create({
    data: {
      name: trimmed,
      entityType,
      query,
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/${entityType}`);
}

export async function deleteSavedView(workspaceSlug: string, entityType: string, viewId: string) {
  const { user, workspace } = await requireWorkspaceAccess(workspaceSlug);

  // Escopado por userId também — view salva é pessoal, ninguém apaga a de outro membro.
  await db.savedView.deleteMany({
    where: { id: viewId, workspaceId: workspace.id, userId: user.id },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/${entityType}`);
}
