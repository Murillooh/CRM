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
import { Plus } from "lucide-react";
import { createDeal } from "@/app/actions/deals";

type Stage = { id: string; name: string };
type Pipeline = { id: string; name: string; stages: Stage[] };

export function DealDialog({ 
  workspaceSlug, 
  pipelines 
}: { 
  workspaceSlug: string;
  pipelines: Pipeline[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Para simplificar, seleciona o primeiro pipeline por padrão
  const defaultPipeline = pipelines[0];
  const [selectedPipelineId, setSelectedPipelineId] = useState(defaultPipeline?.id || "");
  
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      await createDeal(workspaceSlug, formData);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar negócio.");
    } finally {
      setLoading(false);
    }
  }

  if (!defaultPipeline) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" aria-label="Novo Negócio">
          <Plus className="w-4 h-4" />
          Novo Negócio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
          <DialogDescription>
            Adicione uma nova oportunidade ao seu pipeline de vendas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Oportunidade *</Label>
            <Input id="title" name="title" required placeholder="Ex: Projeto XPTO - 10 licenças" disabled={loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Valor Estimado (R$)</Label>
            <Input id="value" name="value" type="number" step="0.01" placeholder="5000.00" disabled={loading} />
          </div>
          
          <input type="hidden" name="pipelineId" value={selectedPipelineId} />
          
          <div className="grid gap-2">
            <Label htmlFor="stageId">Etapa do Funil *</Label>
            <select 
              id="stageId" 
              name="stageId" 
              required 
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Selecione uma etapa</option>
              {selectedPipeline?.stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Negócio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
