"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  function handleDelete() {
    if (!window.confirm(`Excluir a automação "${workflowName}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteAutomation(workspaceSlug, workflowId);
      } catch (err: any) {
        setError(err?.message || "Erro ao excluir automação.");
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
          <DropdownMenuItem onClick={handleDelete} disabled={isPending} className="text-red-600 focus:text-red-600">
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
