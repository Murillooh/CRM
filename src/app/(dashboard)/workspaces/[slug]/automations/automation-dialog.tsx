"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Zap } from "lucide-react";
import { createAutomation } from "@/app/actions/automations";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const ROUTING_CAPABLE_TRIGGERS = ["CONTACT_CREATED", "COMPANY_CREATED"];

interface Stage {
  id: string;
  name: string;
}

export function AutomationDialog({ workspaceSlug, stages }: { workspaceSlug: string; stages: Stage[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState("");
  const [kind, setKind] = useState("routing");

  const isRoutingCapable = ROUTING_CAPABLE_TRIGGERS.includes(triggerType);
  const isHygieneCapable = triggerType === "CONTACT_CREATED";
  const isStallTrigger = triggerType === "DEAL_STALLED";
  const isStageChanged = triggerType === "DEAL_STAGE_CHANGED";
  const isWonAttempted = triggerType === "DEAL_WON_ATTEMPTED";

  function handleTriggerChange(value: string) {
    setTriggerType(value);
    setKind(value === "DEAL_STAGE_CHANGED" ? "demo" : "routing");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      await createAutomation(workspaceSlug, formData);
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao criar automação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Automação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
          <DialogDescription>
            Defina um gatilho para disparar ações automáticas no CRM.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Regra *</Label>
            <Input id="name" name="name" required placeholder="Ex: Criar tarefa quando Negócio Avançar" disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="triggerType">Gatilho (Quando isso acontecer...) *</Label>
            <select
              id="triggerType"
              name="triggerType"
              required
              disabled={loading}
              value={triggerType}
              onChange={(e) => handleTriggerChange(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>Selecione um gatilho</option>
              <option value="CONTACT_CREATED">Novo Contato Criado</option>
              <option value="COMPANY_CREATED">Nova Empresa Criada (sem responsável)</option>
              <option value="DEAL_STALLED">Negócio Parado (sem mudar de etapa)</option>
              <option value="DEAL_STAGE_CHANGED">Negócio Mudar de Etapa (Pipeline)</option>
              <option value="DEAL_WON_ATTEMPTED">Negócio Marcado como Ganho (aprovação de desconto)</option>
              <option value="SCHEDULE_DAILY">Horário Agendado (Diário)</option>
            </select>
          </div>

          {isHygieneCapable && (
            <div className="grid gap-2">
              <Label htmlFor="kind">O que essa regra faz?</Label>
              <select id="kind" name="kind" disabled={loading} value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
                <option value="routing">Atribuir responsável automaticamente</option>
                <option value="hygiene">Verificar dados incompletos e duplicados</option>
              </select>
            </div>
          )}

          {isStallTrigger && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="thresholdDays">Alertar após (dias) *</Label>
                <Input id="thresholdDays" name="thresholdDays" type="number" min={1} defaultValue={5} required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="escalateDays">Escalar +N dias depois *</Label>
                <Input id="escalateDays" name="escalateDays" type="number" min={1} defaultValue={3} required disabled={loading} />
              </div>
            </div>
          )}

          {isRoutingCapable && kind === "routing" && (
            <div className="grid gap-2">
              <Label htmlFor="strategy">Estratégia de Roteamento *</Label>
              <select id="strategy" name="strategy" required disabled={loading} defaultValue="round_robin" className={selectClass}>
                <option value="round_robin">Round-robin (revezamento entre a equipe)</option>
                <option value="territory">Território (região do responsável)</option>
              </select>
            </div>
          )}

          {isHygieneCapable && kind === "hygiene" && (
            <div className="p-3 bg-muted/50 rounded border flex items-start gap-3">
              <Zap className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                Contato sem e-mail ou telefone vira tarefa de &quot;completar cadastro&quot;. Nome ou domínio de e-mail repetido vira sinalização de possível duplicado na timeline.
              </div>
            </div>
          )}

          {isStageChanged && (
            <div className="grid gap-2">
              <Label htmlFor="kind">O que essa regra faz?</Label>
              <select id="kind" name="kind" disabled={loading} value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass}>
                <option value="demo">Ação genérica (demonstração)</option>
                <option value="nurture">Sequência de nutrição por e-mail</option>
              </select>
            </div>
          )}

          {isStageChanged && kind === "nurture" && (
            <div className="space-y-4 border rounded-lg p-3 bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="targetStageId">Estágio inicial da sequência *</Label>
                <select id="targetStageId" name="targetStageId" required disabled={loading} className={selectClass}>
                  <option value="" disabled selected>Selecione o estágio</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Contato para de receber e-mail assim que o negócio sair desse estágio.</p>
              </div>

              {[1, 2].map((n) => (
                <div key={n} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
                  <p className="text-xs font-semibold text-muted-foreground">E-mail {n} {n === 2 && "(opcional)"}</p>
                  <Input name={`step${n}Subject`} placeholder="Assunto" disabled={loading} />
                  <textarea name={`step${n}Body`} placeholder="Mensagem" rows={3} disabled={loading} className={textareaClass} />
                  <div className="grid gap-1 max-w-[160px]">
                    <Label htmlFor={`step${n}DelayDays`} className="text-xs">Espera (dias)</Label>
                    <Input id={`step${n}DelayDays`} name={`step${n}DelayDays`} type="number" min={0} defaultValue={n === 1 ? 0 : 3} disabled={loading} />
                  </div>
                </div>
              ))}

              <div className="p-3 bg-muted/50 rounded border flex items-start gap-3">
                <Zap className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Envia via Resend (remetente do domínio, não a caixa pessoal do rep). Depende de <code>RESEND_API_KEY</code> configurada e do scanner <code>/api/cron/email-nurture</code> agendado.
                </div>
              </div>
            </div>
          )}

          {isWonAttempted && (
            <div className="grid gap-2">
              <Label htmlFor="thresholdPercent">Desconto mínimo que exige aprovação (%) *</Label>
              <Input id="thresholdPercent" name="thresholdPercent" type="number" min={1} max={100} defaultValue={20} required disabled={loading} />
              <p className="text-xs text-muted-foreground">Acima disso, o negócio só é marcado como Ganho depois que um Manager aprovar.</p>
            </div>
          )}

          {triggerType && !isRoutingCapable && !isStallTrigger && !isStageChanged && !isWonAttempted && (
            <div className="p-3 bg-muted/50 rounded border flex items-start gap-3">
              <Zap className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong>Nota:</strong> Para fins de demonstração, este gatilho ainda gera automaticamente uma Ação do tipo "Criar Tarefa".
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Automação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
