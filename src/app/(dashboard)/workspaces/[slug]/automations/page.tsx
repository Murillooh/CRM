import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { AutomationDialog } from "./automation-dialog";
import { Network, Zap, Clock, MoreHorizontal, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function AutomationsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const workflows = await db.workflow.findMany({
    where: { workspaceId: workspace.id },
    include: { actions: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie regras para automatizar o fluxo de trabalho da sua equipe.</p>
        </div>
        <AutomationDialog workspaceSlug={params.slug} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4">
          {workflows.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Network className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma automação ativa</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Reduza o trabalho manual. Configure regras para criar tarefas ou enviar emails quando os negócios avançarem.
              </p>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-5 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full ${workflow.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {workflow.name}
                      {workflow.isActive ? (
                        <span className="flex items-center text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Ativa</span>
                      ) : (
                        <span className="flex items-center text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inativa</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Gatilho:</span> 
                      {workflow.triggerType === "DEAL_STAGE_CHANGED" ? "Mudança de Etapa" : "Horário Agendado"}
                      <span className="mx-2 text-border">•</span>
                      <span className="font-medium text-foreground">Ações:</span> 
                      {workflow.actions.length} configurada(s)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar Automação</DropdownMenuItem>
                      <DropdownMenuItem>{workflow.isActive ? "Desativar" : "Ativar"}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
