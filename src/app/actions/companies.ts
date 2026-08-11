"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { WorkflowEngine } from "@/lib/services/workflow-engine";

/**
 * Nota: ainda não existe uma listagem própria de Companies na UI (fora de escopo desta automação).
 * Esta action existe pra tornar o gatilho COMPANY_CREATED real e testável — mesma base que a
 * futura página de Companies vai reaproveitar.
 */
export async function createCompany(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const domain = formData.get("domain") as string;
  const industry = formData.get("industry") as string;
  const employeeCountRaw = formData.get("employeeCount") as string;
  const region = formData.get("region") as string;

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  const company = await db.company.create({
    data: {
      name,
      domain: domain || null,
      industry: industry || null,
      employeeCount: employeeCountRaw ? parseInt(employeeCountRaw, 10) : null,
      region: region || null,
      workspaceId: workspace.id,
    },
  });

  await WorkflowEngine.evaluateEvent({
    workspaceId: workspace.id,
    triggerType: "COMPANY_CREATED",
    entityType: "Company",
    entityId: company.id,
    data: {
      ownerId: company.ownerId,
      region: company.region,
      employeeCount: company.employeeCount,
    },
  });

  return company;
}
