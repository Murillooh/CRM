"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createDefaultPipeline } from "@/app/actions/deals";

export function CreatePipelineButton({ workspaceSlug }: { workspaceSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await createDefaultPipeline(workspaceSlug);
      } catch (err: any) {
        setError(err?.message || "Erro ao criar pipeline.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Criando..." : "Criar Pipeline"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
