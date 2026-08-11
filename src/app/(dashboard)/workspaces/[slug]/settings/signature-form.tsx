"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateEmailSignature } from "@/app/actions/email-accounts";
import { Save } from "lucide-react";

export function SignatureForm({ workspaceSlug, signature }: { workspaceSlug: string; signature: string | null }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const formData = new FormData(event.currentTarget);
      await updateEmailSignature(workspaceSlug, formData);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        name="emailSignature"
        defaultValue={signature ?? ""}
        disabled={loading}
        rows={4}
        placeholder={"Atenciosamente,\nSeu Nome\nSua Empresa"}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <p className="text-xs text-muted-foreground -mt-2">Entra automaticamente no final de todo e-mail que você mandar pelo CRM.</p>
      {success && <p className="text-sm text-emerald-600">Assinatura salva.</p>}
      <Button type="submit" disabled={loading} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? "Salvando..." : "Salvar Assinatura"}
      </Button>
    </form>
  );
}
