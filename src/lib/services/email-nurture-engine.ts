import { db } from "@/lib/db";
import { Resend } from "resend";
import { isEnrollmentDue, shouldStopEnrollment, getNextStep, computeNextSendAt, type NurtureStep } from "./email-nurture";
import { interpolateTemplate } from "./workflow-template";

const MAX_ENROLLMENTS_PER_TICK = 50;

function getResendClient(): { client: Resend; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY/RESEND_FROM_EMAIL não configurados no ambiente.");
  }
  return { client: new Resend(apiKey), from };
}

/**
 * Chamado pelo scanner de cron (/api/cron/email-nurture). Processa enrollments ACTIVE
 * vencidos: para se o deal saiu do estágio, senão manda o próximo e-mail da sequência
 * (via Resend — remetente genérico do domínio, não a caixa pessoal do rep) e agenda o
 * próximo passo. Endpoint próprio, isolado do sync do Gmail e do scanner de deal parado.
 */
export async function runNurtureTick(now: Date = new Date()) {
  const { client, from } = getResendClient();

  const candidates = await db.workflowEnrollment.findMany({
    where: { status: "ACTIVE" },
    take: MAX_ENROLLMENTS_PER_TICK * 3, // Sobra pra filtrar os due depois (mesmo padrão do resto do Módulo 8)
    include: {
      workflow: { include: { actions: true } },
      contact: { select: { id: true, name: true, email: true } },
    } as any,
  });

  const due = candidates.filter((e: any) => isEnrollmentDue(e, now)).slice(0, MAX_ENROLLMENTS_PER_TICK);

  let sent = 0;
  let stopped = 0;
  let completed = 0;

  for (const enrollment of due) {
    try {
      const result = await processEnrollment(enrollment as any, client, from, now);
      if (result === "sent") sent++;
      if (result === "stopped") stopped++;
      if (result === "completed") completed++;
    } catch (error) {
      console.error(`[EmailNurture] Falha processando enrollment ${enrollment.id}:`, error);
    }
  }

  return { scanned: candidates.length, due: due.length, sent, stopped, completed };
}

async function processEnrollment(
  enrollment: {
    id: string;
    step: number;
    enrolledAtStageId: string;
    dealId: string | null;
    contact: { id: string; name: string; email: string | null };
    workflow: { id: string; workspaceId: string; actions: { actionType: string; payload: any }[] };
  },
  resend: Resend,
  from: string,
  now: Date
): Promise<"sent" | "stopped" | "completed" | "skipped"> {
  const deal = enrollment.dealId ? await db.deal.findUnique({ where: { id: enrollment.dealId }, select: { stageId: true } }) : null;

  if (shouldStopEnrollment(enrollment.enrolledAtStageId, deal?.stageId ?? null)) {
    await db.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "STOPPED" } });
    return "stopped";
  }

  if (!enrollment.contact.email) {
    // Sem e-mail, não dá pra nutrir — para em vez de ficar tentando pra sempre.
    await db.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "STOPPED" } });
    return "stopped";
  }

  const enrollAction = enrollment.workflow.actions.find((a) => a.actionType === "ENROLL_IN_SEQUENCE");
  const steps: NurtureStep[] = enrollAction?.payload?.steps ?? [];
  const step = getNextStep(steps, enrollment.step);

  if (!step) {
    await db.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "COMPLETED" } });
    return "completed";
  }

  const data = { name: enrollment.contact.name, email: enrollment.contact.email };
  const subject = interpolateTemplate(step.subject, data);
  const body = interpolateTemplate(step.body, data);

  const { data: sendResult, error } = await resend.emails.send({
    from,
    to: enrollment.contact.email,
    subject,
    text: body,
  });

  if (error || !sendResult?.id) {
    throw new Error(error?.message ?? "Resend não retornou id da mensagem.");
  }

  // Dedup com o resto da timeline (Módulo 5): mesmo externalId, mesmo mecanismo do Email Sync.
  await db.activity.upsert({
    where: { workspaceId_externalId: { workspaceId: enrollment.workflow.workspaceId, externalId: sendResult.id } },
    update: {},
    create: {
      workspaceId: enrollment.workflow.workspaceId,
      type: "EMAIL",
      externalId: sendResult.id,
      contactId: enrollment.contact.id,
      dealId: enrollment.dealId ?? undefined,
      description: `${subject} — sequência de nutrição`,
      metadata: { to: [enrollment.contact.email], from },
    },
  });

  const nextStep = enrollment.step + 1;
  const isLastStep = getNextStep(steps, nextStep) === null;

  await db.workflowEnrollment.update({
    where: { id: enrollment.id },
    data: {
      step: nextStep,
      status: isLastStep ? "COMPLETED" : "ACTIVE",
      nextSendAt: computeNextSendAt(now, step.delayDays),
    },
  });

  return "sent";
}
