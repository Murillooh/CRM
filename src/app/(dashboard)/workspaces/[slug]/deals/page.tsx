import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Building2, User, Clock, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DealSheet } from "@/components/pipeline/deal-sheet";
import { DealDialog } from "./deal-dialog";

export default async function DealsPage(props: { 
  params: Promise<{ slug: string }> | { slug: string },
  searchParams: Promise<{ dealId?: string }> | { dealId?: string }
}) {
  // Awaiting params/searchParams to support Next.js 15+ async params requirement
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const pipeline = await db.pipeline.findFirst({
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
  });

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
        <Button>Criar Pipeline</Button>
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
        <DealDialog workspaceSlug={params.slug} pipelines={[pipeline]} />
      </div>

      <div className="flex-1 overflow-x-auto p-6 bg-muted/10 snap-x snap-mandatory scroll-smooth">
        <div className="flex h-full gap-4 min-w-max pb-4">
          {pipeline.stages.map((stage: any) => (
            <div key={stage.id} className="w-[85vw] md:w-[320px] flex-shrink-0 flex flex-col bg-muted/30 rounded-xl border border-border/50 snap-center md:snap-align-none">
              <div className="p-3 flex items-center justify-between border-b border-border/50 bg-muted/50 rounded-t-xl">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {stage.name}
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">{stage.deals.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {stage.deals.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Nenhum negócio</span>
                    <span className="text-xs text-muted-foreground/70 mt-1">Solte deals aqui ou crie um novo</span>
                  </div>
                ) : (
                  stage.deals.map((deal: any) => (
                    <Link 
                      href={`?dealId=${deal.id}`}
                      key={deal.id} 
                      className="group relative block bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-grab active:cursor-grabbing"
                      aria-label={`Negócio: ${deal.title}`}
                    >
                      <GripVertical className="absolute right-2 top-2 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors hidden md:block" />
                      
                      <h4 className="font-medium text-sm text-foreground mb-2 leading-tight pr-6">
                        {deal.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        {deal.company ? (
                          <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{deal.company.name}</span>
                          </span>
                        ) : deal.contact ? (
                          <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{deal.contact.name}</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                          {deal.currency} {deal.value?.toLocaleString() || 0}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(deal.updatedAt, { addSuffix: true, locale: ptBR })}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Monta o Drawer Lateral consumindo IA via streaming */}
      <DealSheet workspaceSlug={params.slug} dealId={searchParams.dealId || null} />
    </div>
  );
}
