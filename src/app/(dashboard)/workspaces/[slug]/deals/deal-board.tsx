"use client";

import { useOptimistic, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Building2, User, Clock, Briefcase, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { moveDealStage, updateDealTitle, getPipelineStages } from "@/app/actions/deals";

type BoardDeal = {
  id: string;
  title: string;
  value: number | null;
  currency: string;
  updatedAt: Date;
  company: { name: string } | null;
  contact: { name: string } | null;
};

type BoardStage = {
  id: string;
  name: string;
  deals: BoardDeal[];
};

/** Kanban do Pipeline com drag-and-drop real (HTML5 DnD nativo, sem dependência extra). */
export function DealBoard({ workspaceSlug, pipelineId, stages }: { workspaceSlug: string; pipelineId: string; stages: BoardStage[] }) {
  const [currentStages, setCurrentStages] = useState(stages);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStages(stages);
  }, [stages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getPipelineStages(workspaceSlug, pipelineId);
        if (data && data.length > 0) {
          setCurrentStages(data);
        }
      } catch (err) {
        // Silencioso em caso de erro de rede
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [workspaceSlug, pipelineId]);

  // Move o card na hora, antes do servidor confirmar — arrastar não pode esperar
  // o round-trip (persistir + registrar atividade + avaliar automações) pra se
  // mexer na tela. Reconcilia sozinho com o estado real assim que a Server
  // Action resolve (revalidatePath já traz `stages` atualizado de qualquer forma);
  // se a mutação falhar, o catch do handleDrop cuida de mostrar o erro e o board
  // volta pro estado real (useOptimistic descarta a atualização otimista).
  const [optimisticStages, applyOptimisticMove] = useOptimistic(
    currentStages,
    (current: BoardStage[], move: { dealId: string; fromStageId: string; toStageId: string }) => {
      let movedDeal: BoardDeal | undefined;
      const withoutDeal = current.map((stage) => {
        if (stage.id !== move.fromStageId) return stage;
        const deal = stage.deals.find((d) => d.id === move.dealId);
        if (deal) movedDeal = deal;
        return { ...stage, deals: stage.deals.filter((d) => d.id !== move.dealId) };
      });
      if (!movedDeal) return current;
      return withoutDeal.map((stage) =>
        stage.id === move.toStageId ? { ...stage, deals: [movedDeal!, ...stage.deals] } : stage
      );
    }
  );

  function handleTitleSave(dealId: string, currentTitle: string, nextTitle: string) {
    setEditingDealId(null);
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === currentTitle) return;
    startTransition(async () => {
      try {
        await updateDealTitle(workspaceSlug, dealId, trimmed);
      } catch (err: any) {
        setError(err?.message || "Erro ao renomear negócio.");
      }
    });
  }

  function handleDrop(stageId: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStageId(null);

    const dealId = e.dataTransfer.getData("text/deal-id");
    const fromStageId = e.dataTransfer.getData("text/from-stage-id");
    if (!dealId || fromStageId === stageId) return;

    setError(null);
    startTransition(async () => {
      applyOptimisticMove({ dealId, fromStageId, toStageId: stageId });
      try {
        await moveDealStage(workspaceSlug, dealId, stageId);
      } catch (err: any) {
        setError(err?.message || "Erro ao mover negócio.");
      }
    });
  }

  return (
    <div className="flex-1 overflow-x-auto p-6 bg-muted/10 snap-x snap-mandatory scroll-smooth">
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="text-xs underline underline-offset-2">
            fechar
          </button>
        </div>
      )}

      <div className="flex h-full gap-4 min-w-max pb-4">
        {optimisticStages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={() => setDragOverStageId((current) => (current === stage.id ? null : current))}
            onDrop={(e) => handleDrop(stage.id, e)}
            className={`w-[85vw] md:w-[320px] flex-shrink-0 flex flex-col rounded-xl border transition-colors snap-center md:snap-align-none ${
              dragOverStageId === stage.id ? "border-primary/60 bg-primary/5" : "border-border/50 bg-muted/30"
            }`}
          >
            <div className="p-3 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md rounded-t-xl sticky top-0 z-10">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)] bg-primary"></div>
                {stage.name}
              </h3>
              <Badge variant="secondary" className="font-mono text-xs bg-background shadow-sm border-border/50">{stage.deals.length}</Badge>
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
                stage.deals.map((deal) => (
                  <Link
                    href={`?dealId=${deal.id}`}
                    key={deal.id}
                    draggable={editingDealId !== deal.id}
                    onClick={(e) => {
                      if (editingDealId === deal.id) e.preventDefault();
                    }}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/deal-id", deal.id);
                      e.dataTransfer.setData("text/from-stage-id", stage.id);
                    }}
                    className={`group relative block bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing ${
                      isPending ? "opacity-60" : ""
                    }`}
                    aria-label={`Negócio: ${deal.title}`}
                  >
                    <GripVertical className="absolute right-2 top-2 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors hidden md:block" />

                      <div className="flex justify-between items-start mb-3 gap-1">
                        {editingDealId === deal.id ? (
                          <input
                            autoFocus
                            type="text"
                            defaultValue={deal.title}
                            aria-label="Título do negócio"
                            onClick={(e) => e.preventDefault()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") setEditingDealId(null);
                            }}
                            onBlur={(e) => handleTitleSave(deal.id, deal.title, e.currentTarget.value)}
                            className="flex-1 min-w-0 font-semibold text-sm bg-background border border-primary rounded px-1.5 py-0.5 outline-none mr-4"
                          />
                        ) : (
                          <>
                            <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                              {deal.title}
                            </h4>
                            <button
                              type="button"
                              aria-label="Editar título"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingDealId(deal.id);
                              }}
                              className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        {deal.company ? (
                          <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                              {deal.company.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px] font-medium">{deal.company.name}</span>
                          </span>
                        ) : deal.contact ? (
                          <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                              {deal.contact.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px] font-medium">{deal.contact.name}</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {deal.currency} {deal.value?.toLocaleString() || 0}
                        </span>

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
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
  );
}
