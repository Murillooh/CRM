/**
 * Regras puras da sequência de nutrição (Módulo 8). O cron (/api/cron/email-nurture)
 * faz as queries e chama isso pra decidir o quê fazer com cada enrollment.
 */

export interface NurtureStep {
  subject: string;
  body: string;
  delayDays: number; // Dias após o envio anterior (ou o enroll, no step 0) pro próximo envio
}

export interface EnrollmentLike {
  status: "ACTIVE" | "STOPPED" | "COMPLETED";
  nextSendAt: Date;
}

export function isEnrollmentDue(enrollment: EnrollmentLike, now: Date): boolean {
  return enrollment.status === "ACTIVE" && enrollment.nextSendAt <= now;
}

/** O deal saiu do estágio em que foi enrolled -> a sequência para (decisão aprovada: só por mudança de estágio, não por resposta ainda). */
export function shouldStopEnrollment(enrolledAtStageId: string, currentStageId: string | null): boolean {
  if (!currentStageId) return true; // Deal sem estágio (ex: deletado/edge case) -> não faz sentido continuar
  return currentStageId !== enrolledAtStageId;
}

/** Próximo step da sequência, ou null se já mandou tudo (sequência completa). */
export function getNextStep(steps: NurtureStep[], currentStep: number): NurtureStep | null {
  return steps[currentStep] ?? null;
}

export function computeNextSendAt(now: Date, delayDays: number): Date {
  return new Date(now.getTime() + delayDays * 86_400_000);
}
