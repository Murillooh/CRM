/**
 * Regras puras do "Alerta de deal parado" (Módulo 8). Sem I/O — o scanner de cron
 * e o WorkflowEngine fazem as queries e chamam essas funções pra decidir.
 */

/** Dias inteiros corridos entre duas datas (arredondado pra baixo). */
export function daysBetween(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / 86_400_000);
}

/** Resolve o assignee de uma CREATE_TASK: "OWNER" pega o dono da entidade no contexto do evento. */
export function resolveTaskAssignee(payload: { assignTo?: string; assigneeId?: string }, data: Record<string, unknown>): string | null {
  if (payload.assignTo === "OWNER") {
    const ownerId = data.ownerId;
    return typeof ownerId === "string" ? ownerId : null;
  }
  return payload.assigneeId ?? null;
}

/** Escalonamento pro manager só dispara depois de `minDaysInStage` (N + M dias). */
export function shouldNotifyManager(daysInStage: number, minDaysInStage: number): boolean {
  return daysInStage >= minDaysInStage;
}
