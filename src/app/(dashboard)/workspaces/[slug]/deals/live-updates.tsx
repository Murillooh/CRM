"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function LiveUpdates({ workspaceSlug, initialLastUpdate }: { workspaceSlug: string, initialLastUpdate: string | null }) {
  const router = useRouter();
  const currentLastUpdate = useRef(initialLastUpdate);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceSlug}/deals/latest`, {
          cache: "no-store", // Garantir que não pegue cache
        });
        
        if (res.ok) {
          const data = await res.json();
          // Se a data do servidor for diferente da nossa atual, significa que houve mudança
          if (data.lastUpdate && data.lastUpdate !== currentLastUpdate.current) {
            currentLastUpdate.current = data.lastUpdate;
            router.refresh(); // Pede ao Next.js para refazer o fetch do servidor mantendo o estado da UI
          }
        }
      } catch (err) {
        // Falhas de rede silenciosas
      }
    }, 3000); // Polling a cada 3 segundos para sensação de "Tempo Real"

    return () => clearInterval(interval);
  }, [workspaceSlug, router]);

  return null; // Este componente não renderiza nada visual
}
