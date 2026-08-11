"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission, AuthorizationError } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { WorkflowEngine } from "@/lib/services/workflow-engine";
import { needsDiscountApproval } from "@/lib/services/deal-approval";

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

/**
 * Move um Deal pra outra Etapa (drag-and-drop do Kanban). Carimba `stageEnteredAt` e
 * dispara o gatilho DEAL_STAGE_CHANGED do WorkflowEngine (Módulo 8).
 */
export async function moveDealStage(workspaceSlug: string, dealId: string, newStageId: string) {
  const { user, workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  requirePermission(role, "update", "Deal");

  const deal = await db.deal.findFirst({
    where: { id: dealId, workspaceId: workspace.id },
  });
  if (!deal) {
    throw new Error("Negócio não encontrado.");
  }

  // Sales Rep só move os próprios negócios (mesma regra de ownership do GET /deals)
  if (role === "SALES_REP" && deal.ownerId !== user.id) {
    throw new AuthorizationError("Você só pode mover negócios dos quais é responsável.");
  }

  if (deal.stageId === newStageId) {
    return deal; // Soltou na mesma coluna, nada a fazer
  }

  const targetStage = await db.pipelineStage.findFirst({
    where: { id: newStageId, workspaceId: workspace.id, pipelineId: deal.pipelineId },
  });
  if (!targetStage) {
    throw new Error("Etapa inválida para o funil deste negócio.");
  }

  const fromStageId = deal.stageId;

  const updated = await db.deal.update({
    where: { id: dealId },
    data: { stageId: newStageId, stageEnteredAt: new Date() },
  });

  await db.activity.create({
    data: {
      workspaceId: workspace.id,
      type: "STAGE_CHANGED",
      dealId: deal.id,
      performerId: user.id,
      description: `Negócio movido para a etapa "${targetStage.name}".`,
      metadata: { fromStageId, toStageId: newStageId },
    },
  });

  await WorkflowEngine.evaluateEvent({
    workspaceId: workspace.id,
    triggerType: "DEAL_STAGE_CHANGED",
    entityType: "Deal",
    entityId: deal.id,
    data: {
      fromStage: fromStageId,
      toStage: newStageId,
      ownerId: deal.ownerId,
      contactId: deal.contactId,
      value: deal.value ? deal.value.toNumber() : null,
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
  return updated;
}

/**
 * Tenta marcar o Deal como Ganho. Se houver uma automação de aprovação de desconto ativa
 * (DEAL_WON_ATTEMPTED) e o desconto declarado bater o limiar, bloqueia — dispara o
 * WorkflowEngine (cria a tarefa pro Manager) e recusa a mutação até um Manager aprovar.
 * Guarda síncrona de propósito: precisa impedir o status na hora, não só logar depois.
 */
export async function markDealWon(workspaceSlug: string, dealId: string, discountPercent: number = 0) {
  const { workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  requirePermission(role, "update", "Deal");

  const deal = await db.deal.findFirst({ where: { id: dealId, workspaceId: workspace.id } });
  if (!deal) {
    throw new Error("Negócio não encontrado.");
  }

  const approvalWorkflow = await db.workflow.findFirst({
    where: { workspaceId: workspace.id, triggerType: "DEAL_WON_ATTEMPTED", isActive: true },
  });

  const threshold =
    approvalWorkflow?.condition && typeof approvalWorkflow.condition === "object"
      ? (approvalWorkflow.condition as any).value
      : null;

  const needsApproval =
    typeof threshold === "number" && needsDiscountApproval(discountPercent, threshold, deal.approvalStatus);

  if (needsApproval) {
    await db.deal.update({ where: { id: dealId }, data: { discountPercent } });

    await WorkflowEngine.evaluateEvent({
      workspaceId: workspace.id,
      triggerType: "DEAL_WON_ATTEMPTED",
      entityType: "Deal",
      entityId: dealId,
      data: { discountPercent },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/deals`);
    throw new Error(`Desconto de ${discountPercent}% precisa de aprovação de um Manager antes de marcar como ganho.`);
  }

  await db.deal.update({ where: { id: dealId }, data: { status: "WON", discountPercent, closedAt: new Date() } });
  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
}

/**
 * Marca o Deal como Perdido. Existe principalmente pra Relatórios (Módulo de analytics) —
 * sem isso, "taxa de ganho" nunca teria denominador (status só saía de OPEN via markDealWon).
 */
export async function markDealLost(workspaceSlug: string, dealId: string, reason?: string) {
  const { workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  requirePermission(role, "update", "Deal");

  const deal = await db.deal.findFirst({ where: { id: dealId, workspaceId: workspace.id } });
  if (!deal) {
    throw new Error("Negócio não encontrado.");
  }

  await db.deal.update({ where: { id: dealId }, data: { status: "LOST", closedAt: new Date() } });

  if (reason) {
    await db.activity.create({
      data: {
        workspaceId: workspace.id,
        type: "SYSTEM_LOG",
        dealId,
        description: `Negócio marcado como perdido: ${reason}`,
      },
    });
  }

  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
}

const APPROVER_ROLES = ["MANAGER", "ADMIN", "OWNER"];

export async function approveDealDiscount(workspaceSlug: string, dealId: string) {
  const { user, workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  if (!APPROVER_ROLES.includes(role)) {
    throw new AuthorizationError("Só Manager, Admin ou Owner podem aprovar desconto.");
  }

  await db.deal.updateMany({
    where: { id: dealId, workspaceId: workspace.id },
    data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date() },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
}

export async function rejectDealDiscount(workspaceSlug: string, dealId: string) {
  const { user, workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  if (!APPROVER_ROLES.includes(role)) {
    throw new AuthorizationError("Só Manager, Admin ou Owner podem rejeitar desconto.");
  }

  await db.deal.updateMany({
    where: { id: dealId, workspaceId: workspace.id },
    data: { approvalStatus: "REJECTED", approvedById: user.id, approvedAt: new Date() },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/deals`);
}
