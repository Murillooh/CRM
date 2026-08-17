"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removeMember } from "@/app/actions/settings";

export function RemoveMemberButton({ 
  workspaceSlug, 
  userId, 
  disabled 
}: { 
  workspaceSlug: string; 
  userId: string; 
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled || isPending}
      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
      onClick={() => {
        if (confirm("Tem certeza que deseja remover este usuário do workspace?")) {
          startTransition(async () => {
            try {
              await removeMember(workspaceSlug, userId);
            } catch (err: any) {
              alert(err.message || "Erro ao remover membro.");
            }
          });
        }
      }}
      title="Remover usuário"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
