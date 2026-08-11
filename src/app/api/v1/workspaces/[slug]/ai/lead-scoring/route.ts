import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getEntityTimeline } from "@/app/actions/activities";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/api/utils";
import { db } from "@/lib/db";

const ScoreRequestSchema = z.object({
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
    if (!checkRateLimit(`ai:lead-scoring:${ip}`, 5)) {
      return NextResponse.json({ error: "Rate limit de IA excedido." }, { status: 429 });
    }

    const { workspace, role } = await requireWorkspaceAccess(resolvedParams.slug);
    requirePermission(role, "read", "Deal");

    const body = await req.json();
    const { dealId } = ScoreRequestSchema.parse(body);

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

    const systemPrompt = `Você é um sistema especialista em CRM de Lead Scoring.
Avalie os dados e a timeline deste negócio (Deal) e atribua um score de 0 a 100 de probabilidade de fechamento ou engajamento.
Leve em consideração a frequência de interações, o tempo no estágio atual, se há reuniões agendadas, e quem tomou a iniciativa (vendedor ou cliente).
Retorne os seguintes campos estritamente no formato JSON estruturado:
- score: número de 0 a 100
- reason: uma explicação curta de no máximo 2 frases do porquê desta nota.
- label: uma classificação fixa exata ("Frio", "Morno" ou "Quente").`;

    const userPrompt = `
**Detalhes do Negócio:**
- Título: ${deal.title}
- Criado em: ${deal.createdAt.toISOString()}
- Estágio atual: ${deal.stage.name}
- Status atual: ${deal.status}
- Empresa/Contato associado: ${deal.company?.name || deal.contact?.name || "N/A"}

**Histórico de Atividades (Últimas 30):**
${formattedTimeline || "Nenhuma atividade."}
`;

    // Usa generateObject para garantir um JSON estruturado tipado
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        score: z.number().min(0).max(100),
        reason: z.string(),
        label: z.enum(["Frio", "Morno", "Quente"]),
      }),
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("[AI Agent Lead Scoring Error]", error);
    return NextResponse.json(
      { error: "Erro interno no Agente de Scoring", details: error.message },
      { status: 500 }
    );
  }
}
