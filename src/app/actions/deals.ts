"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function createDeal(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const title = formData.get("title") as string;
  const value = formData.get("value") as string;
  const stageId = formData.get("stageId") as string;
  const pipelineId = formData.get("pipelineId") as string;

  if (!title || !stageId || !pipelineId) {
    throw new Error("Título, Funil e Etapa são obrigatórios.");
  }

  await db.deal.create({
    data: {
      title,
      value: value ? parseFloat(value) : 0,
      stageId,
      pipelineId,
      workspaceId: workspace.id,
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
}
