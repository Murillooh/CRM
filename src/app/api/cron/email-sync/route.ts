import { NextRequest, NextResponse } from "next/server";
import { runEmailSyncTick } from "@/lib/services/email-sync-engine";

export const dynamic = "force-dynamic";

/**
 * Scanner de cron do Email Sync (Módulo 5). Endpoint separado do /api/cron/tick (deal
 * parado) de propósito — um travar/estourar timeout não deve atrasar o outro.
 * Protegido por CRON_SECRET (Vercel Cron assina automaticamente quando a env var existe).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado no ambiente." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await runEmailSyncTick();
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
  } catch (error: any) {
    console.error("[EmailSync] Tick falhou:", error);
    return NextResponse.json({ error: error?.message ?? "Erro desconhecido" }, { status: 500 });
  }
}
