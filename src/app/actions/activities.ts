"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission } from "@/lib/auth/permissions";

export interface GetTimelineParams {
  dealId?: string;
  contactId?: string;
  companyId?: string;
}

/**
 * Busca a Timeline de Atividades usando Cursor-based Pagination
 * Alta performance para infinite scroll em bancos SQL
 */
export async function getEntityTimeline(
  workspaceSlug: string,
  entity: GetTimelineParams,
  cursor?: string, // O ID da última atividade carregada
  limit: number = 20
) {
  const { workspace, role } = await requireWorkspaceAccess(workspaceSlug);

  // Validate that the user has read access to the specific entity type
  if (entity.dealId) requirePermission(role, "read", "Deal");
  if (entity.contactId) requirePermission(role, "read", "Contact");
  if (entity.companyId) requirePermission(role, "read", "Company");

  if (!entity.dealId && !entity.contactId && !entity.companyId) {
    throw new Error("Must provide at least one entity ID to fetch its timeline.");
  }

  // Define as condições dinamicamente baseada na entidade requerida
  const whereClause = {
    workspaceId: workspace.id,
    ...(entity.dealId && { dealId: entity.dealId }),
    ...(entity.contactId && { contactId: entity.contactId }),
    ...(entity.companyId && { companyId: entity.companyId }),
  };

  const activities = await db.activity.findMany({
    where: whereClause,
    take: limit + 1, // Pega um a mais para saber se tem próxima página
    ...(cursor && {
      skip: 1, // Pula o próprio cursor
      cursor: {
        id: cursor,
      },
    }),
    orderBy: {
      createdAt: "desc", // Timeline mais recente primeiro
    },
    include: {
      performer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (activities.length > limit) {
    // Remove o último item que pedimos extra para definir o nextCursor
    const nextItem = activities.pop();
    nextCursor = nextItem?.id;
  }

  return {
    items: activities,
    nextCursor,
  };
}
