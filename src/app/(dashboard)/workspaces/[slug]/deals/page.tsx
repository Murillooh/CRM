import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { Building2 } from "lucide-react";
import { DealSheet } from "@/components/pipeline/deal-sheet";
import { DealDialog } from "./deal-dialog";
import { DealBoard } from "./deal-board";
import { CreatePipelineButton } from "./create-pipeline-button";

export default async function DealsPage(props: { 
  params: Promise<{ slug: string }> | { slug: string },
  searchParams: Promise<{ dealId?: string }> | { dealId?: string }
}) {
  // Awaiting params/searchParams to support Next.js 15+ async params requirement
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const { workspace, role } = await requireWorkspaceAccess(params.slug);

  const [pipeline, emailAccounts] = await Promise.all([
    db.pipeline.findFirst({
      where: { workspaceId: workspace.id },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            deals: {
              include: { company: true, contact: true },
              orderBy: { updatedAt: "desc" }
            }
          }
        }
      }
    }),
    db.emailAccount.findMany({
      where: { workspaceId: workspace.id, status: "CONNECTED" },
      select: { id: true, emailAddress: true },
    }),
  ]);

  const openDeal = searchParams.dealId
    ? pipeline?.stages.flatMap((s) => s.deals).find((d: any) => d.id === searchParams.dealId)
    : undefined;

  if (!pipeline || pipeline.stages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Nenhum Pipeline Encontrado</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Parece que você ainda não configurou seu funil de vendas. Crie seu primeiro pipeline para começar a rastrear negócios.
        </p>
        <CreatePipelineButton workspaceSlug={params.slug} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus negócios e acompanhe o fluxo de receita.</p>
        </div>
        <DealDialog 
          workspaceSlug={params.slug} 
          pipelines={[{ 
            id: pipeline.id, 
            name: pipeline.name, 
            stages: pipeline.stages.map(s => ({ id: s.id, name: s.name })) 
          }]} 
        />
      </div>

      {/*
        Deal.value é um Decimal do Prisma — não serializa através da fronteira
        Server->Client Component, então convertemos pra number aqui antes de descer.
      */}
      <DealBoard
        workspaceSlug={params.slug}
        stages={pipeline.stages.map((stage: any) => ({
          id: stage.id,
          name: stage.name,
          deals: stage.deals.map((deal: any) => ({
            id: deal.id,
            title: deal.title,
            value: deal.value ? deal.value.toNumber() : null,
            currency: deal.currency,
            updatedAt: deal.updatedAt,
            company: deal.company ? { name: deal.company.name } : null,
            contact: deal.contact ? { name: deal.contact.name } : null,
          })),
        }))}
      />

      {/* Monta o Drawer Lateral consumindo IA via streaming */}
      <DealSheet
        workspaceSlug={params.slug}
        dealId={searchParams.dealId || null}
        emailAccounts={emailAccounts}
        contactEmail={openDeal?.contact?.email ?? null}
        dealSummary={
          openDeal
            ? {
                status: openDeal.status,
                approvalStatus: openDeal.approvalStatus,
                discountPercent: openDeal.discountPercent,
              }
            : null
        }
        canApprove={["MANAGER", "ADMIN", "OWNER"].includes(role)}
      />
    </div>
  );
}
