/**
 * Estratégias de atribuição de responsável (roteamento de leads).
 * Funções puras — sem I/O — pra serem testáveis e reaproveitadas pelo WorkflowEngine.
 */

export interface RoutableMember {
  id: string; // userId do membro elegível (ex: SALES_REP)
  region?: string | null;
}

export interface CompanySizeTier {
  /** Limite superior (inclusivo) de funcionários pra cair nesse tier. */
  maxEmployees: number;
  assigneeId: string;
}

/**
 * Cicla pela lista de membros elegíveis a partir do último atribuído.
 * Sem membros -> null. Cursor desconhecido (membro saiu da lista) -> reinicia do primeiro.
 */
export function pickRoundRobin(members: RoutableMember[], lastAssignedId: string | null): string | null {
  if (members.length === 0) return null;
  if (!lastAssignedId) return members[0].id;

  const idx = members.findIndex((m) => m.id === lastAssignedId);
  if (idx === -1) return members[0].id;

  return members[(idx + 1) % members.length].id;
}

/**
 * Prioriza membros cujo `region` bate com o território do lead.
 * Sem território informado ou sem membro nesse território -> cai pra round-robin geral.
 */
export function pickByTerritory(
  members: RoutableMember[],
  region: string | null,
  lastAssignedId: string | null
): string | null {
  if (!region) return pickRoundRobin(members, lastAssignedId);

  const inRegion = members.filter((m) => m.region === region);
  if (inRegion.length === 0) return pickRoundRobin(members, lastAssignedId);

  return pickRoundRobin(inRegion, lastAssignedId);
}

/**
 * Escolhe o assignee do menor tier cujo `maxEmployees` comporta o porte da empresa.
 * Sem porte conhecido ou fora de todos os tiers -> fallback.
 */
export function pickByCompanySize(
  tiers: CompanySizeTier[],
  employeeCount: number | null,
  fallbackAssigneeId: string | null
): string | null {
  if (employeeCount == null) return fallbackAssigneeId;

  const sorted = [...tiers].sort((a, b) => a.maxEmployees - b.maxEmployees);
  for (const tier of sorted) {
    if (employeeCount <= tier.maxEmployees) return tier.assigneeId;
  }

  return fallbackAssigneeId;
}
