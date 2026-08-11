/**
 * Regra pura da aprovação condicional de desconto (Módulo 8). markDealWon usa isso como
 * guarda síncrona antes de confirmar o status — não passa pelo WorkflowEngine assíncrono
 * porque precisa bloquear a mutação na hora, não só logar depois.
 */
export type DealApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export function needsDiscountApproval(
  discountPercent: number,
  thresholdPercent: number,
  currentStatus: DealApprovalStatus
): boolean {
  if (currentStatus === "APPROVED") return false;
  return discountPercent >= thresholdPercent;
}
