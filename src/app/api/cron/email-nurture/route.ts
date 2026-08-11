import { NextRequest, NextResponse } from "next/server";
import { runNurtureTick } from "@/lib/services/email-nurture-engine";

export const dynamic = "force-dynamic";

/**
 * Scanner de cron da sequência de nutrição (Módulo 8). Endpoint isolado do sync do Gmail
 * e do scanner de deal parado — um travar não deve atrasar os outros.
 * Protegido por CRON_SECRET (mesma convenção dos outros crons).
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
    const result = await runNurtureTick();
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
  } catch (error: any) {
    console.error("[EmailNurture] Tick falhou:", error);
    return NextResponse.json({ error: error?.message ?? "Erro desconhecido" }, { status: 500 });
  }
}
