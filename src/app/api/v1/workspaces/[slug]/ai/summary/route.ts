import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getEntityTimeline } from "@/app/actions/activities";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/api/utils";
import { db } from "@/lib/db";

// Validação do Payload de Requisição
const SummaryRequestSchema = z.object({
  dealId: z.string().min(1, "O ID do negócio é obrigatório."),
});

// Aumenta o timeout padrão de functions serverless da vercel se necessário
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    // 1. Defesa: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`ai:summary:${ip}`, 5)) {
      return NextResponse.json({ error: "Rate limit de IA excedido." }, { status: 429 });
    }

    // 2. Autorização (RBAC)
    const { workspace, role } = await requireWorkspaceAccess(resolvedParams.slug);
    requirePermission(role, "read", "Deal");

    // 3. Parsing do Input
    const body = await req.json();
    const { dealId } = SummaryRequestSchema.parse(body);

    // 4. Busca Contexto de Negócios 
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

    // 5. Busca Timeline (Últimas 30 atividades) via Action interna segura
    const timeline = await getEntityTimeline(resolvedParams.slug, { dealId }, undefined, 30);

    // Formata a timeline para a IA entender
    const formattedTimeline = timeline.items.map((t) => {
      return `[${t.createdAt.toISOString().split("T")[0]}] Tipo: ${t.type} | Por: ${t.performer?.name || "Sistema"} | Ação: ${t.description}`;
    }).join("\n");

    // 6. Engenharia do Prompt
    const systemPrompt = `Você é um brilhante assistente executivo de CRM B2B. 
A sua missão é ler as atividades recentes do negócio e fazer um resumo super rápido (máximo 3 frases) focado no status atual e no próximo passo pendente.
Não invente dados. Seja profissional. Aja como se estivesse explicando rapidamente para o executivo de vendas.`;

    const userPrompt = `
**Detalhes do Negócio:**
- Título: ${deal.title}
- Valor: ${deal.currency} ${deal.value || 0}
- Estágio atual: ${deal.stage.name}
- Status: ${deal.status}
- Probabilidade: ${deal.probability || 0}%
- Empresa/Contato associado: ${deal.company?.name || deal.contact?.name || "N/A"}

**Histórico de Atividades (Últimas 30):**
${formattedTimeline || "Nenhuma atividade registrada ainda."}

Com base nestes dados, escreva o resumo executivo indicando como está a saúde do negócio e se há estagnação.`;

    // 7. Chamada ao OpenAI via Vercel AI SDK com Streaming Mágico
    // Isso requer a variável de ambiente OPENAI_API_KEY configurada.
    const result = streamText({
      model: openai("gpt-4o-mini"), // Modelo super rápido e barato, ideal para sumários
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Menos alucinação, mais pragmatismo B2B
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[AI Agent 1 Error]", error);
    return NextResponse.json(
      { error: "Erro interno no Agente de Sumarização", details: error.message },
      { status: 500 }
    );
  }
}
