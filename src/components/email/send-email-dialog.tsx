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
import { Mail, Send, Loader2 } from "lucide-react";
import { sendEmail } from "@/app/actions/email";

interface EmailAccountOption {
  id: string;
  emailAddress: string;
}

interface SendEmailDialogProps {
  workspaceSlug: string;
  emailAccounts: EmailAccountOption[];
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  dealId?: string;
  contactId?: string;
  companyId?: string;
  trigger?: React.ReactNode;
}

export function SendEmailDialog({
  workspaceSlug,
  emailAccounts,
  defaultTo,
  defaultSubject,
  defaultBody,
  dealId,
  contactId,
  companyId,
  trigger,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      await sendEmail(workspaceSlug, {
        emailAccountId: formData.get("emailAccountId") as string,
        to: formData.get("to") as string,
        subject: formData.get("subject") as string,
        body: formData.get("body") as string,
        dealId,
        contactId,
        companyId,
      });
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  }

  if (emailAccounts.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Conecte um e-mail em Configurações pra enviar por aqui"
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Enviar e-mail
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Enviar e-mail
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enviar e-mail</DialogTitle>
          <DialogDescription>Sai da sua caixa conectada e já entra na timeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {emailAccounts.length > 1 ? (
            <div className="grid gap-2">
              <Label htmlFor="emailAccountId">Enviar como</Label>
              <select
                id="emailAccountId"
                name="emailAccountId"
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {emailAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.emailAddress}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="emailAccountId" value={emailAccounts[0].id} />
          )}

          <div className="grid gap-2">
            <Label htmlFor="to">Para *</Label>
            <Input id="to" name="to" type="email" required defaultValue={defaultTo} disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input id="subject" name="subject" required defaultValue={defaultSubject} disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Mensagem *</Label>
            <textarea
              id="body"
              name="body"
              required
              defaultValue={defaultBody}
              disabled={loading}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">Sua assinatura (Configurações) entra automaticamente no final.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
