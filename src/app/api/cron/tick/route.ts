import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WorkflowEngine } from "@/lib/services/workflow-engine";
import { daysBetween } from "@/lib/services/deal-stall";

export const dynamic = "force-dynamic";

/**
 * Scanner de cron do Módulo 8. Substitui o trigger SCHEDULE_DAILY, que nunca teve produtor.
 * Chamado externamente (Vercel Cron via vercel.json, ou manualmente em dev) — não roda sozinho.
 *
 * Protegido por CRON_SECRET: Vercel Cron assina automaticamente com
 * `Authorization: Bearer $CRON_SECRET` quando a env var existe no projeto.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no ambiente." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const workspacesWithStallWorkflows = await db.workflow.findMany({
    where: { triggerType: "DEAL_STALLED", isActive: true },
    select: { workspaceId: true },
    distinct: ["workspaceId"],
  });

  const now = new Date();
  let scanned = 0;

  for (const { workspaceId } of workspacesWithStallWorkflows) {
    const openDeals = await db.deal.findMany({
      where: { workspaceId, status: "OPEN", deletedAt: null },
      select: { id: true, stageEnteredAt: true, ownerId: true },
    });

    for (const deal of openDeals) {
      await WorkflowEngine.evaluateEvent({
        workspaceId,
        triggerType: "DEAL_STALLED",
        entityType: "Deal",
        entityId: deal.id,
        data: {
          daysInStage: daysBetween(deal.stageEnteredAt, now),
          ownerId: deal.ownerId,
        },
      });
      scanned++;
    }
  }

  return NextResponse.json({ ok: true, scanned, at: now.toISOString() });
}
