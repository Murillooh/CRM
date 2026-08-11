import { db } from "@/lib/db";
import { ActivityType } from "@prisma/client";

export interface LogActivityParams {
  workspaceId: string;
  performerId: string;
  type: ActivityType;
  description: string;
  metadata?: any; // JSON Object
  dealId?: string;
  companyId?: string;
  contactId?: string;
}

/**
 * Serviço centralizado para registrar eventos na auditoria/timeline.
 * Mantém o código limpo ao disparar eventos em outros arquivos.
 */
export async function logActivity(params: LogActivityParams) {
  // Pelo menos uma entidade deve ser vinculada para a atividade fazer sentido na timeline
  if (!params.dealId && !params.companyId && !params.contactId) {
    throw new Error("Activity must be linked to at least one entity (Deal, Company, or Contact).");
  }

  const activity = await db.activity.create({
    data: {
      workspaceId: params.workspaceId,
      performerId: params.performerId,
      type: params.type,
      description: params.description,
      metadata: params.metadata || {},
      dealId: params.dealId,
      companyId: params.companyId,
      contactId: params.contactId,
    },
  });

  return activity;
}
