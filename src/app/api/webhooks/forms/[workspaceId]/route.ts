import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// CORS Headers para permitir requisições de qualquer domínio
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const params = await props.params;
    const workspaceId = params.workspaceId;

    // Verificar se workspace existe
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 404, headers: corsHeaders });
    }

    // Tentar ler como JSON ou FormData
    let data: Record<string, any> = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    }

    const {
      name,
      email,
      phone,
      companyName,
      message,
      marketView,
      bottleneck,
      acquisition,
      retention,
      commitmentScore,
    } = data;

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Nome e Email (ou Telefone) são obrigatórios" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Encontrar o primeiro funil de vendas e a primeira etapa dele
    const firstPipeline = await db.pipeline.findFirst({
      where: { workspaceId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!firstPipeline || firstPipeline.stages.length === 0) {
      return NextResponse.json(
        { error: "Nenhum funil de vendas configurado neste workspace" },
        { status: 400, headers: corsHeaders }
      );
    }

    const firstStage = firstPipeline.stages[0];

    // Criar ou Buscar Empresa (Opcional)
    let companyId = null;
    if (companyName) {
      // Procura primeiro pelo nome
      const existingCompany = await db.company.findFirst({
        where: { workspaceId, name: companyName },
      });

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const newCompany = await db.company.create({
          data: {
            name: companyName,
            workspaceId,
          },
        });
        companyId = newCompany.id;
      }
    }

    // Criar ou Atualizar Contato
    let contact;
    if (email) {
      // Upsert pelo email + workspaceId não é direto pois não há unique constraints nativas perfeitas para isso,
      // então faremos findFirst e depois create ou update.
      const existingContact = await db.contact.findFirst({
        where: { workspaceId, email },
      });

      if (existingContact) {
        contact = await db.contact.update({
          where: { id: existingContact.id },
          data: {
            name: name,
            phone: phone || existingContact.phone,
            companyId: companyId || existingContact.companyId,
          },
        });
      } else {
        contact = await db.contact.create({
          data: {
            name,
            email,
            phone,
            companyId,
            workspaceId,
          },
        });
      }
    } else {
      // Se não tem email, cria apenas pelo telefone/nome
      contact = await db.contact.create({
        data: {
          name,
          phone,
          companyId,
          workspaceId,
        },
      });
    }

    // Criar Deal
    const dealTitle = companyName 
      ? `Lead: ${companyName} (${name})`
      : `Lead: ${name}`;

    const deal = await db.deal.create({
      data: {
        title: dealTitle,
        workspaceId,
        pipelineId: firstPipeline.id,
        stageId: firstStage.id,
        contactId: contact.id,
        companyId: companyId,
        // Você pode definir um valor padrão ou deixar nulo
      },
    });

    // Se houver mensagem e/ou respostas de qualificação, adicionamos como nota no Deal.
    // Precisamos do autor para a nota. Como é externo, vamos criar uma nota "Sistema"
    // ou se não for possível, omitir. O schema de Note exige `authorId`.
    // Como não temos `authorId` para envios externos (webhook), precisamos de uma Activity do tipo SYSTEM_LOG.
    const qualificationLines: string[] = [];
    if (marketView) qualificationLines.push(`Como vê o mercado hoje: ${marketView}`);
    if (bottleneck) qualificationLines.push(`Maior gargalo na empresa: ${bottleneck}`);
    if (acquisition) qualificationLines.push(`Como capta clientes hoje: ${acquisition}`);
    if (retention) qualificationLines.push(`Como mantém clientes comprando recorrente: ${retention}`);
    if (commitmentScore !== undefined && commitmentScore !== null && commitmentScore !== "") {
      qualificationLines.push(`Disposição (0-10) para resolver a maior dor: ${commitmentScore}`);
    }

    const noteSections = [
      message ? `Mensagem enviada via formulário do site:\n\n${message}` : null,
      qualificationLines.length ? `Diagnóstico do lead:\n${qualificationLines.join("\n")}` : null,
    ].filter(Boolean);

    if (noteSections.length > 0) {
      await db.activity.create({
        data: {
          type: "SYSTEM_LOG",
          description: noteSections.join("\n\n"),
          workspaceId,
          dealId: deal.id,
          contactId: contact.id,
          companyId: companyId,
        }
      });
    }

    // Você pode querer redirecionar caso a requisição venha de um form HTML puro sem JS
    const redirectUrl = data.redirectUrl || data.redirect_url;
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl, { status: 302, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, dealId: deal.id, contactId: contact.id }, { headers: corsHeaders });
  } catch (error) {
    console.error("[FORM_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500, headers: corsHeaders });
  }
}
