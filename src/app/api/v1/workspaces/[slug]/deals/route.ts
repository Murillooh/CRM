import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api/utils";
import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { requirePermission } from "@/lib/auth/permissions";
import { createDeal } from "@/app/actions/deals";
import { DealStatus } from "@prisma/client";

// Schema para Criação de Deal
const CreateDealSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(100),
  value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  expectedCloseDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    // 1. Rate Limiting (exemplo usando IP)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`deals:get:${ip}`)) {
      return NextResponse.json({ error: { code: "TOO_MANY_REQUESTS", message: "Rate limit excedido." } }, { status: 429 });
    }

    // 2. Auth e Permissão
    const { user, workspace, role } = await requireWorkspaceAccess(resolvedParams.slug);
    requirePermission(role, "read", "Deal");

    // 3. Extração de Query Params
    const url = new URL(req.url);
    const stageId = url.searchParams.get("stageId");
    const status = url.searchParams.get("status") as DealStatus | null;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);

    // Filtro condicional baseado em Ownership (RBAC de Sales Rep)
    const ownerFilter = role === "SALES_REP" ? { ownerId: user.id } : {};

    // 4. Query no Banco
    const deals = await db.deal.findMany({
      where: {
        workspaceId: workspace.id,
        ...(stageId && { stageId }),
        ...(status && { status }),
        ...ownerFilter,
      },
      take: limit > 100 ? 100 : limit, // Cap em 100 registros por query
      skip,
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(deals);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`deals:post:${ip}`, 20)) {
      return NextResponse.json({ error: { code: "TOO_MANY_REQUESTS", message: "Rate limit excedido." } }, { status: 429 });
    }

    // 2. Validação do Body (Zod)
    const body = await req.json();
    const validatedData = CreateDealSchema.parse(body);

    // A action createDeal já faz a validação de acesso e permissão internamente,
    // garantindo reutilização da nossa camada de domínio.
    const newDeal = await createDeal(resolvedParams.slug, validatedData);

    return apiResponse(newDeal, 201);
  } catch (error) {
    return apiError(error);
  }
}
