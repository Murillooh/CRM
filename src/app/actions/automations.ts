"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function createAutomation(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const triggerType = formData.get("triggerType") as "DEAL_STAGE_CHANGED" | "SCHEDULE_DAILY";

  if (!name || !triggerType) {
    throw new Error("Nome e Gatilho são obrigatórios.");
  }

  await db.workflow.create({
    data: {
      name,
      triggerType,
      workspaceId: workspace.id,
      isActive: true,
      actions: {
        create: [
          // Ação padrão genérica para fins de demonstração
          {
            actionType: "CREATE_TASK",
            payload: { title: "Tarefa Automática" }
          }
        ]
      }
    }
  });

  revalidatePath(`/workspaces/${workspaceSlug}/automations`);
}

export async function toggleAutomation(workspaceSlug: string, workflowId: string, isActive: boolean) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  await db.workflow.updateMany({
    where: { 
      id: workflowId,
      workspaceId: workspace.id 
    },
    data: {
      isActive
    }
  });

  revalidatePath(`/workspaces/${workspaceSlug}/automations`);
}
