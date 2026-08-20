"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCompletion } from "@ai-sdk/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Sparkles, Loader2, ArrowRight, Mail, Thermometer, Info, Trophy, ShieldCheck, ShieldX, Clock, XCircle, Phone, Users, FileText, ArrowRightLeft, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendEmailDialog } from "@/components/email/send-email-dialog";
import { markDealWon, markDealLost, approveDealDiscount, rejectDealDiscount } from "@/app/actions/deals";
import { getEntityTimeline } from "@/app/actions/activities";

type TimelineActivity = Awaited<ReturnType<typeof getEntityTimeline>>["items"][number];

const ACTIVITY_ICONS: Record<string, typeof Bot> = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Users,
  NOTE_ADDED: FileText,
  STAGE_CHANGED: ArrowRightLeft,
  SYSTEM_LOG: Bot,
};

interface DealSummary {
  status: "OPEN" | "WON" | "LOST";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  discountPercent: number | null;
}

interface DealSheetProps {
  workspaceSlug: string;
  dealId: string | null;
  emailAccounts?: { id: string; emailAddress: string }[];
  contactEmail?: string | null;
  dealSummary?: DealSummary | null;
  canApprove?: boolean;
}

export function DealSheet({
  workspaceSlug,
  dealId,
  emailAccounts = [],
  contactEmail = null,
  dealSummary = null,
  canApprove = false,
}: DealSheetProps) {
  const router = useRouter();

  const [discountInput, setDiscountInput] = useState(0);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isClosing, startClosing] = useTransition();
  const [isApproving, startApproving] = useTransition();

  function handleMarkWon() {
    if (!dealId) return;
    setCloseError(null);
    startClosing(async () => {
      try {
        await markDealWon(workspaceSlug, dealId, discountInput);
      } catch (err: any) {
        setCloseError(err?.message || "Erro ao marcar como ganho.");
      }
    });
  }

  function handleMarkLost() {
    if (!dealId) return;
    if (!confirm("Marcar esse negócio como perdido?")) return;
    setCloseError(null);
    startClosing(async () => {
      try {
        await markDealLost(workspaceSlug, dealId);
      } catch (err: any) {
        setCloseError(err?.message || "Erro ao marcar como perdido.");
      }
    });
  }

  function handleApprove() {
    if (!dealId) return;
    startApproving(async () => {
      await approveDealDiscount(workspaceSlug, dealId);
    });
  }

  function handleReject() {
    if (!dealId) return;
    startApproving(async () => {
      await rejectDealDiscount(workspaceSlug, dealId);
    });
  }

  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const { completion: summary, complete: completeSummary, isLoading: isLoadingSummary, stop: stopSummary } = useCompletion({
    api: `/api/v1/workspaces/${workspaceSlug}/ai/summary`,
    onError: (err) => setSummaryError(err?.message || "Erro ao gerar resumo. Tente novamente."),
  });

  const { completion: emailDraft, complete: completeEmail, isLoading: isLoadingEmail, stop: stopEmail } = useCompletion({
    api: `/api/v1/workspaces/${workspaceSlug}/ai/email-draft`,
    onError: (err) => setEmailError(err?.message || "Erro ao gerar rascunho. Tente novamente."),
  });

  const [leadScore, setLeadScore] = useState<{ score: number, reason: string, label: string } | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  // Timeline real do Deal (Últimas Atividades) — antes era placeholder estático
  const [timelineItems, setTimelineItems] = useState<TimelineActivity[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  const loadTimeline = useCallback(async (currentDealId: string, full: boolean) => {
    setIsLoadingTimeline(true);
    setTimelineError(null);
    try {
      const result = await getEntityTimeline(workspaceSlug, { dealId: currentDealId }, undefined, full ? 50 : 3);
      setTimelineItems(result.items);
    } catch (err) {
      setTimelineError(err instanceof Error ? err.message : "Erro ao carregar atividades.");
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [workspaceSlug]);

  function handleToggleTimeline() {
    if (!dealId) return;
    const nextExpanded = !timelineExpanded;
    setTimelineExpanded(nextExpanded);
    loadTimeline(dealId, nextExpanded);
  }

  // Dispara a IA sempre que o Sheet abrir para um dealId específico
  useEffect(() => {
    if (dealId) {
      setSummaryError(null);
      setEmailError(null);
      completeSummary("", { body: { dealId } });

      // Fetch Lead Score (Agent 3)
      setIsLoadingScore(true);
      fetch(`/api/v1/workspaces/${workspaceSlug}/ai/lead-scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId })
      })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setLeadScore(data);
        setIsLoadingScore(false);
      })
      .catch(() => setIsLoadingScore(false));

      // Timeline real (mini, últimas 3)
      setTimelineExpanded(false);
      loadTimeline(dealId, false);

    } else {
      stopSummary();
      stopEmail();
      setLeadScore(null);
      setSummaryError(null);
      setEmailError(null);
      setTimelineItems([]);
      setTimelineError(null);
      setTimelineExpanded(false);
    }
  }, [dealId, workspaceSlug, completeSummary, stopSummary, stopEmail, loadTimeline]);

  return (
    <Sheet open={!!dealId} onOpenChange={(open) => {
      if (!open) {
        stopSummary();
        stopEmail();
        setLeadScore(null);
        // Remove dealId from URL softly
        router.push(`/workspaces/${workspaceSlug}/deals`);
      }
    }}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle>Detalhes do Negócio</SheetTitle>
              <SheetDescription>
                Histórico e contexto de vendas
              </SheetDescription>
            </div>
            
            {/* Agent 3: Lead Score Badge */}
            {isLoadingScore ? (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin mr-1" /> Avaliando
              </Badge>
            ) : leadScore ? (
              <div className="group relative">
                <Badge variant="outline" className={`cursor-help ${
                  leadScore.label === 'Quente' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                  leadScore.label === 'Morno' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                  'border-blue-300 bg-blue-50 text-blue-700'
                }`}>
                  <Thermometer className="w-3 h-3 mr-1" />
                  Score: {leadScore.score} ({leadScore.label})
                </Badge>
                {/* Score Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <span className="font-semibold block mb-1">Análise de Engajamento:</span>
                  {leadScore.reason}
                </div>
              </div>
            ) : null}
          </div>
        </SheetHeader>

        {/* Agent 1: AI Summary Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-xl p-5 mb-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24 text-purple-600 rotate-12" />
          </div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-300">
                Resumo Executivo (IA)
              </h3>
            </div>
          </div>

          <div className="text-sm text-foreground/90 leading-relaxed relative z-10">
            {isLoadingSummary && !summary ? (
              <div className="flex flex-col items-center justify-center py-4 text-muted-foreground animate-pulse gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span className="text-xs font-medium">Analisando contexto...</span>
              </div>
            ) : summaryError ? (
              <div className="flex flex-col items-start gap-2 py-2">
                <span className="text-xs text-red-600 dark:text-red-400">{summaryError}</span>
                <button
                  onClick={() => { setSummaryError(null); completeSummary("", { body: { dealId } }); }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : summary ? (
              <div className="prose prose-sm dark:prose-invert">
                <p>{summary}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Agent 2: AI Email Draft Generator */}
        <div className="border border-border/50 bg-muted/20 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Rascunho de E-mail</h3>
            </div>
            {!emailDraft && !isLoadingEmail && (
              <button
                onClick={() => { setEmailError(null); completeEmail("", { body: { dealId } }); }}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {emailError ? "Tentar novamente" : "Gerar Sugestão"}
              </button>
            )}
          </div>

          {isLoadingEmail && !emailDraft ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs">Escrevendo rascunho...</span>
            </div>
          ) : emailError ? (
            <p className="text-xs text-red-600 dark:text-red-400 text-center py-4">{emailError}</p>
          ) : emailDraft ? (
            <div className="bg-background border rounded-lg p-3 text-sm whitespace-pre-wrap font-sans text-muted-foreground relative">
              <Badge variant="outline" className="absolute -top-2.5 right-2 bg-background text-[10px] uppercase text-primary border-primary/20">Sugestão de IA</Badge>
              {emailDraft}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Gere um rascunho de follow-up baseado no histórico atual.
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <SendEmailDialog
              workspaceSlug={workspaceSlug}
              emailAccounts={emailAccounts}
              dealId={dealId ?? undefined}
              defaultTo={contactEmail ?? undefined}
              defaultBody={emailDraft || undefined}
            />
          </div>
        </div>

        {/* Fechar Negócio + Aprovação condicional de desconto (Módulo 8) */}
        {dealSummary && dealSummary.status !== "WON" && (
          <div className="border border-border/50 bg-muted/20 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Fechar Negócio</h3>
            </div>

            {dealSummary.approvalStatus === "PENDING" ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-md bg-amber-100 text-amber-800 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Aguardando aprovação de desconto ({dealSummary.discountPercent}%) por um Manager antes de marcar como ganho.
                </div>
                {canApprove && (
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1" onClick={handleApprove} disabled={isApproving}>
                      {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={handleReject} disabled={isApproving}>
                      <ShieldX className="w-3.5 h-3.5" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="grid gap-1 flex-1">
                    <label htmlFor="discountPercent" className="text-xs text-muted-foreground">Desconto aplicado (%)</label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min={0}
                      max={100}
                      value={discountInput}
                      onChange={(e) => setDiscountInput(Number(e.target.value))}
                      disabled={isClosing}
                      className="h-9"
                    />
                  </div>
                  <Button size="sm" className="gap-1" onClick={handleMarkWon} disabled={isClosing}>
                    {isClosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                    Marcar como Ganho
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={handleMarkLost} disabled={isClosing}>
                    <XCircle className="w-3.5 h-3.5" />
                    Marcar como Perdido
                  </Button>
                </div>
                {closeError && <p className="text-xs text-red-600">{closeError}</p>}
              </div>
            )}
          </div>
        )}

        {dealSummary?.status === "WON" && (
          <div className="mb-8 flex items-center gap-2 p-3 rounded-md bg-emerald-100 text-emerald-800 text-sm font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
            <Trophy className="w-4 h-4" />
            Negócio ganho{dealSummary.discountPercent ? ` (desconto de ${dealSummary.discountPercent}%)` : ""}
          </div>
        )}

        {/* Timeline real do Deal, via getEntityTimeline (Activity) */}
        <div>
          <h3 className="font-semibold text-sm mb-4 text-foreground/80">Últimas Atividades</h3>

          {isLoadingTimeline && timelineItems.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Carregando atividades...
            </div>
          ) : timelineError ? (
            <p className="text-xs text-red-600 dark:text-red-400 py-2">{timelineError}</p>
          ) : timelineItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhuma atividade registrada ainda.</p>
          ) : (
            <div className="space-y-4 border-l-2 border-muted ml-3 pl-4">
              {timelineItems.map((item, idx) => {
                const Icon = ACTIVITY_ICONS[item.type] ?? Bot;
                return (
                  <div key={item.id} className="relative">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background ${idx === 0 ? "bg-primary" : "bg-muted"}`} />
                    <p className={`text-sm font-medium flex items-center gap-1.5 ${idx === 0 ? "" : "text-muted-foreground"}`}>
                      <Icon className="w-3 h-3 shrink-0" />
                      {item.description || item.type}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {item.performer?.name ? `${item.performer.name} · ` : ""}
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {(timelineItems.length > 0 || timelineExpanded) && (
            <button
              onClick={handleToggleTimeline}
              disabled={isLoadingTimeline}
              className="mt-6 flex items-center gap-2 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isLoadingTimeline ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  {timelineExpanded ? "Mostrar menos" : "Ver timeline completa"}
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
