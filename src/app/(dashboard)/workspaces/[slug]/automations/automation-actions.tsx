"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toggleAutomation, deleteAutomation } from "@/app/actions/automations";

export function AutomationActions({
  workspaceSlug,
  workflowId,
  workflowName,
  isActive,
}: {
  workspaceSlug: string;
  workflowId: string;
  workflowName: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      try {
        await toggleAutomation(workspaceSlug, workflowId, !isActive);
      } catch (err: any) {
        setError(err?.message || "Erro ao atualizar automação.");
      }
    });
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteAutomation(workspaceSlug, workflowId);
        setConfirmOpen(false);
      } catch (err: any) {
        setError(err?.message || "Erro ao excluir automação.");
        setConfirmOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
            {isActive ? "Desativar" : "Ativar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="text-red-600 focus:text-red-600"
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-red-600">{error}</span>}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto sm:mx-0 mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle>Excluir automação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <span className="font-medium text-foreground">&ldquo;{workflowName}&rdquo;</span>?
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
