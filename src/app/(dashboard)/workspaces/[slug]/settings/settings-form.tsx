"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspace } from "@/app/actions/settings";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

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
      
      // Auto-hide success message after a while
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 relative">
      <div className="grid gap-3">
        <Label htmlFor="name" className="text-foreground/90 font-medium tracking-tight">Nome do Workspace</Label>
        <Input 
          id="name" 
          name="name" 
          defaultValue={workspace.name} 
          required 
          disabled={loading} 
          className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
        />
        <p className="text-sm text-muted-foreground">
          Este é o nome da sua empresa ou equipe.
        </p>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="slug" className="text-foreground/90 font-medium tracking-tight">Slug da URL</Label>
        <div className="flex items-center shadow-sm rounded-md overflow-hidden ring-1 ring-border/50 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <span className="flex items-center px-4 bg-muted/50 text-sm text-muted-foreground h-11 border-r border-border/50 font-medium">
            app.crm.com/workspaces/
          </span>
          <Input 
            id="slug" 
            name="slug" 
            defaultValue={workspace.slug} 
            required 
            disabled={loading}
            className="h-11 border-0 rounded-none bg-background/50 focus-visible:ring-0 shadow-none flex-1"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Cuidado: alterar a URL pode quebrar links favoritos antigos.
        </p>
      </div>

      {/* Area de mensagens com transição suave */}
      <div className="min-h-[48px] flex flex-col justify-center">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button 
          type="submit" 
          disabled={loading} 
          className="h-11 px-8 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? "Salvando alterações..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}
