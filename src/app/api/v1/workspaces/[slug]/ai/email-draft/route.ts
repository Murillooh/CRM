import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getEntityTimeline } from "@/app/actions/activities";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/api/utils";
import { db } from "@/lib/db";

const DraftRequestSchema = z.object({
  dealId: z.string().min(1, "O ID do negócio é obrigatório."),
});

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`ai:email-draft:${ip}`, 5)) {
      return NextResponse.json({ error: "Rate limit de IA excedido." }, { status: 429 });
    }

    const { workspace, role } = await requireWorkspaceAccess(resolvedParams.slug);
    requirePermission(role, "read", "Deal");

    const body = await req.json();
    const { dealId } = DraftRequestSchema.parse(body);

    const deal = await db.deal.findUnique({
      where: { id: dealId, workspaceId: workspace.id },
      include: {
        company: true,
        contact: true,
        stage: true,
      }
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal não encontrado." }, { status: 404 });
    }

    const timeline = await getEntityTimeline(resolvedParams.slug, { dealId }, undefined, 30);
    const formattedTimeline = timeline.items.map((t) => {
      return `[${t.createdAt.toISOString().split("T")[0]}] Tipo: ${t.type} | Por: ${t.performer?.name || "Sistema"} | Ação: ${t.description}`;
    }).join("\n");

    const systemPrompt = `Você é um excelente executivo de vendas (SDR/BDR).
Sua missão é rascunhar um e-mail curto, persuasivo e profissional de follow-up para o cliente do negócio fornecido.
Aja baseado no histórico recente de atividades e no estágio atual do negócio.
Se o negócio estiver no estágio inicial, foque em agendar uma reunião ou enviar material.
Se estiver no final, foque em fechamento e próximos passos.
Nunca crie ou invente nomes, preços, ou fatos que não estão no histórico.
O e-mail deve ter um tom amigável, mas corporativo, e ter no máximo 3-4 parágrafos pequenos.
Inclua um assunto (Subject:) no começo.`;

    const userPrompt = `
**Detalhes do Negócio:**
- Título: ${deal.title}
- Estágio atual: ${deal.stage.name}
- Empresa/Contato associado: ${deal.company?.name || deal.contact?.name || "N/A"}

**Histórico de Atividades (Últimas 30):**
${formattedTimeline || "Nenhuma atividade."}

Escreva o rascunho do e-mail.`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[AI Agent Email Draft Error]", error);
    return NextResponse.json(
      { error: "Erro interno no Agente de E-mail", details: error.message },
      { status: 500 }
    );
  }
}
