"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Plug, Unplug, AlertCircle, Loader2 } from "lucide-react";
import { disconnectEmailAccount } from "@/app/actions/email-accounts";

type EmailAccount = {
  id: string;
  emailAddress: string;
  status: "CONNECTED" | "ERROR" | "DISCONNECTED";
  lastSyncAt: Date | null;
  lastError: string | null;
};

export function EmailAccountsSection({
  workspaceSlug,
  accounts,
  banner,
}: {
  workspaceSlug: string;
  accounts: EmailAccount[];
  banner: { type: "connected" | "error"; message?: string } | null;
}) {
  const [isPending, startTransition] = useTransition();
  const activeAccounts = accounts.filter((a) => a.status !== "DISCONNECTED");

  function handleDisconnect(id: string) {
    if (!confirm("Desconectar essa caixa? O sync e o envio por ela param até reconectar.")) return;
    startTransition(async () => {
      await disconnectEmailAccount(workspaceSlug, id);
    });
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`p-3 rounded-md text-sm flex items-center gap-2 ${
            banner.type === "connected"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {banner.type === "connected" ? <Plug className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {banner.type === "connected" ? "E-mail conectado com sucesso." : `Falha ao conectar: ${banner.message ?? "erro desconhecido"}`}
        </div>
      )}

      {activeAccounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma caixa conectada ainda. Conecte pra sincronizar e enviar e-mail direto do CRM.</p>
      ) : (
        <div className="space-y-2">
          {activeAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{account.emailAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.lastSyncAt ? `Último sync: ${account.lastSyncAt.toLocaleString("pt-BR")}` : "Sync ainda não rodou"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={account.status === "CONNECTED" ? "default" : "outline"} className={account.status === "ERROR" ? "border-red-300 text-red-700" : ""}>
                  {account.status === "CONNECTED" ? "Conectado" : "Com erro"}
                </Badge>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => handleDisconnect(account.id)} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                  Desconectar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="gap-2" asChild>
        <a href={`/api/v1/workspaces/${workspaceSlug}/email-accounts/connect`}>
          <Plug className="h-4 w-4" />
          Conectar Gmail
        </a>
      </Button>
    </div>
  );
}
