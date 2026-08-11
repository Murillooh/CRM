"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCompletion } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, ArrowRight, Mail, Thermometer, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function DealSheet({ workspaceSlug, dealId }: { workspaceSlug: string, dealId: string | null }) {
  const router = useRouter();
  
  const { completion: summary, complete: completeSummary, isLoading: isLoadingSummary, stop: stopSummary } = useCompletion({
    api: `/api/v1/workspaces/${workspaceSlug}/ai/summary`,
  });

  const { completion: emailDraft, complete: completeEmail, isLoading: isLoadingEmail, stop: stopEmail } = useCompletion({
    api: `/api/v1/workspaces/${workspaceSlug}/ai/email-draft`,
  });

  const [leadScore, setLeadScore] = useState<{ score: number, reason: string, label: string } | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  // Dispara a IA sempre que o Sheet abrir para um dealId específico
  useEffect(() => {
    if (dealId) {
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

    } else {
      stopSummary();
      stopEmail();
      setLeadScore(null);
    }
  }, [dealId, workspaceSlug, completeSummary, stopSummary, stopEmail]);

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
                onClick={() => completeEmail("", { body: { dealId } })}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Gerar Sugestão
              </button>
            )}
          </div>

          {isLoadingEmail && !emailDraft ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs">Escrevendo rascunho...</span>
            </div>
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
        </div>

        {/* Fake Timeline for visual context */}
        <div>
          <h3 className="font-semibold text-sm mb-4 text-foreground/80">Últimas Atividades</h3>
          <div className="space-y-4 border-l-2 border-muted ml-3 pl-4">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-background" />
              <p className="text-sm font-medium">Estágio alterado para Fechamento</p>
              <span className="text-xs text-muted-foreground">Há 2 horas</span>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-muted rounded-full ring-4 ring-background" />
              <p className="text-sm font-medium text-muted-foreground">Nota adicionada pelo Vendedor</p>
              <span className="text-xs text-muted-foreground">Ontem</span>
            </div>
          </div>
          
          <button className="mt-6 flex items-center gap-2 text-xs font-medium text-primary hover:underline">
            Ver timeline completa <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </SheetContent>
    </Sheet>
  );
}
