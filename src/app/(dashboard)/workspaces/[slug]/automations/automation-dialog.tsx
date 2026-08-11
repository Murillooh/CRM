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

export function AutomationDialog({ workspaceSlug }: { workspaceSlug: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      await createAutomation(workspaceSlug, formData);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar automação.");
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
      <DialogContent className="sm:max-w-[425px]">
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled selected>Selecione um gatilho</option>
              <option value="DEAL_STAGE_CHANGED">Negócio Mudar de Etapa (Pipeline)</option>
              <option value="SCHEDULE_DAILY">Horário Agendado (Diário)</option>
            </select>
          </div>

          <div className="p-3 bg-muted/50 rounded border flex items-start gap-3 mt-4">
            <Zap className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong>Nota:</strong> Para fins de demonstração, toda automação criada irá gerar automaticamente uma Ação do tipo "Criar Tarefa". Você poderá personalizar isso nas próximas versões.
            </div>
          </div>
          
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
