import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api/utils";
import { getEntityTimeline } from "@/app/actions/activities";

// O Zod valida que pelo menos uma entidade seja informada na busca da timeline
const QuerySchema = z.object({
  dealId: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
}).refine(data => data.dealId || data.contactId || data.companyId, {
  message: "É obrigatório fornecer dealId, contactId ou companyId para buscar a timeline.",
  path: ["entityIds"]
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    // Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`activities:get:${ip}`)) {
      return NextResponse.json({ error: { code: "TOO_MANY_REQUESTS", message: "Rate limit excedido." } }, { status: 429 });
    }

    // Pega as chaves da URL e valida via Zod
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const query = QuerySchema.parse(queryParams);

    // Reaproveita a action de timeline que já faz as checagens de autorização no banco
    const result = await getEntityTimeline(
      resolvedParams.slug,
      {
        dealId: query.dealId,
        contactId: query.contactId,
        companyId: query.companyId,
      },
      query.cursor,
      query.limit
    );

    return apiResponse(result.items, 200, { nextCursor: result.nextCursor });
  } catch (error) {
    return apiError(error);
  }
}
