"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspace } from "@/app/actions/settings";
import { Save } from "lucide-react";

export function SettingsForm({ 
  workspace 
}: { 
  workspace: { slug: string; name: string }
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const formData = new FormData(event.currentTarget);
      await updateWorkspace(workspace.slug, formData);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do Workspace</Label>
        <Input 
          id="name" 
          name="name" 
          defaultValue={workspace.name} 
          required 
          disabled={loading} 
        />
        <p className="text-sm text-muted-foreground">
          Este é o nome da sua empresa ou equipe.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Slug da URL</Label>
        <div className="flex items-center">
          <span className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-sm text-muted-foreground h-10">
            app.crm.com/workspaces/
          </span>
          <Input 
            id="slug" 
            name="slug" 
            defaultValue={workspace.slug} 
            required 
            disabled={loading}
            className="rounded-l-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Cuidado: alterar a URL pode quebrar links favoritos antigos.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">
          Configurações salvas com sucesso!
        </div>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}
