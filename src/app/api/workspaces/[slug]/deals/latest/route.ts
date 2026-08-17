import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { workspace } = await requireWorkspaceAccess(params.slug);
    
    // Busca o deal mais recém-atualizado deste workspace para saber se algo mudou
    // (Pode ser um novo deal criado pelo webhook, ou uma movimentação)
    const latestDeal = await db.deal.findFirst({
      where: {
        stage: { pipeline: { workspaceId: workspace.id } }
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    return NextResponse.json({
      lastUpdate: latestDeal ? latestDeal.updatedAt.toISOString() : null
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
