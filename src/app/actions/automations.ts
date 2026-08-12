"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { TriggerType, ActionType } from "@prisma/client";

const ROUTING_CAPABLE_TRIGGERS: TriggerType[] = ["CONTACT_CREATED", "COMPANY_CREATED"];

export async function createAutomation(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const triggerType = formData.get("triggerType") as TriggerType;
  const kind = (formData.get("kind") as string) || "routing"; // routing | hygiene | nurture | demo
  const strategy = formData.get("strategy") as string | null;

  if (!name || !triggerType) {
    throw new Error("Nome e Gatilho são obrigatórios.");
  }

  // Prisma tipa Json de forma estrita demais pra Record<string, unknown> genérico; `any` aqui
  // é intencional (mesmo padrão do `condition: Json?` já existente no schema).
  let condition: any;
  let actions: { actionType: ActionType; payload: any }[];

  if (ROUTING_CAPABLE_TRIGGERS.includes(triggerType) && kind === "hygiene") {
    // Higiene de dados (só faz sentido pra Contact — Company não tem email/phone obrigatório).
    // Sem condition de topo: cada action se auto-guarda com sua própria `condition` (ver engine).
    condition = undefined;
    actions = [
      {
        actionType: "CREATE_TASK",
        payload: {
          title: "Completar cadastro de {{name}}",
          condition: { operator: "anyNull", value: ["email", "phone"] },
        },
      },
      {
        actionType: "FLAG_DUPLICATE",
        payload: { condition: { field: "hasDuplicate", operator: "equals", value: true } },
      },
    ];
  } else if (ROUTING_CAPABLE_TRIGGERS.includes(triggerType)) {
    // Roteamento de leads: só atribui quem ainda não tem responsável.
    condition = { field: "ownerId", operator: "isNull" };
    actions = [{ actionType: "ASSIGN_OWNER", payload: { strategy: strategy || "round_robin" } }];
  } else if (triggerType === "DEAL_STALLED") {
    const thresholdDays = parseInt((formData.get("thresholdDays") as string) || "5", 10);
    const escalateDays = parseInt((formData.get("escalateDays") as string) || "3", 10);

    // Só roda a partir de N dias parado; a ação de escalar pro manager tem seu próprio
    // guard interno (minDaysInStage = N + M) pra só disparar se persistir.
    condition = { field: "daysInStage", operator: "gte", value: thresholdDays };
    actions = [
      {
        actionType: "CREATE_TASK",
        payload: { title: `Follow-up: negócio parado há ${thresholdDays}+ dias`, assignTo: "OWNER", dueDays: 1 },
      },
      {
        actionType: "NOTIFY_MANAGER",
        payload: { minDaysInStage: thresholdDays + escalateDays },
      },
    ];
  } else if (triggerType === "DEAL_STAGE_CHANGED" && kind === "nurture") {
    const targetStageId = formData.get("targetStageId") as string;
    if (!targetStageId) throw new Error("Selecione o estágio inicial da sequência.");

    const steps = [1, 2]
      .map((n) => ({
        subject: (formData.get(`step${n}Subject`) as string) || "",
        body: (formData.get(`step${n}Body`) as string) || "",
        delayDays: parseInt((formData.get(`step${n}DelayDays`) as string) || "3", 10),
      }))
      .filter((s) => s.subject && s.body);

    if (steps.length === 0) {
      throw new Error("Configure pelo menos 1 e-mail da sequência (assunto + mensagem).");
    }

    condition = { field: "toStage", operator: "equals", value: targetStageId };
    actions = [{ actionType: "ENROLL_IN_SEQUENCE", payload: { steps } }];
  } else if (triggerType === "DEAL_WON_ATTEMPTED") {
    const thresholdPercent = parseInt((formData.get("thresholdPercent") as string) || "20", 10);

    condition = { field: "discountPercent", operator: "gte", value: thresholdPercent };
    actions = [{ actionType: "REQUIRE_APPROVAL", payload: {} }];
  } else {
    // Ação padrão genérica para fins de demonstração
    actions = [{ actionType: "CREATE_TASK", payload: { title: "Tarefa Automática" } }];
  }

  await db.workflow.create({
    data: {
      name,
      triggerType,
      workspaceId: workspace.id,
      isActive: true,
      condition,
      actions: {
        create: actions.map((action, order) => ({ ...action, order })),
      },
    },
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

export async function deleteAutomation(workspaceSlug: string, workflowId: string) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  // deleteMany (não delete) pra garantir escopo por workspaceId — evita apagar
  // workflow de outro workspace mesmo se o id vazar/for adivinhado.
  await db.workflow.deleteMany({
    where: {
      id: workflowId,
      workspaceId: workspace.id,
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/automations`);
}
