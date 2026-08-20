// force rebuild
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFormSlug } from "@/app/actions/settings";

interface FormsSectionProps {
  workspaceSlug: string;
  formSlug: string | null;
}

export function FormsSection({ workspaceSlug, formSlug }: FormsSectionProps) {
  const router = useRouter();
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaved, setSlugSaved] = useState(false);

  async function onSaveSlug(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSlug(true);
    setSlugError(null);
    setSlugSaved(false);
    try {
      const formData = new FormData(event.currentTarget);
      await updateFormSlug(workspaceSlug, formData);
      setSlugSaved(true);
      router.refresh();
      setTimeout(() => setSlugSaved(false), 2500);
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : "Erro ao salvar o nome do link.");
    } finally {
      setSavingSlug(false);
    }
  }

  // O host será substituído no cliente
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  // Link público usa o nome customizado (formSlug), se definido; senão cai no slug
  // interno do workspace (curto, legível) — nunca no id interno (cuid longo).
  const publicSlug = formSlug || workspaceSlug;
  const webhookUrl = `${baseUrl}/api/webhooks/forms/${publicSlug}`;
  const hostedFormUrl = `${baseUrl}/f/${publicSlug}`;

  const htmlSnippet = `<!-- Incorporar este formulário no seu site -->
<form action="${webhookUrl}" method="POST" style="max-width: 400px; font-family: sans-serif; display: flex; flex-direction: column; gap: 12px;">

  <label for="name" style="font-weight: 500;">Nome Completo *</label>
  <input type="text" id="name" name="name" required style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />

  <label for="email" style="font-weight: 500;">E-mail *</label>
  <input type="email" id="email" name="email" required style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />

  <label for="phone" style="font-weight: 500;">Telefone</label>
  <input type="tel" id="phone" name="phone" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />

  <label for="companyName" style="font-weight: 500;">Nome da Empresa</label>
  <input type="text" id="companyName" name="companyName" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />

  <label for="marketView" style="font-weight: 500;">Como você vê seu mercado hoje?</label>
  <textarea id="marketView" name="marketView" rows="2" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>

  <label for="bottleneck" style="font-weight: 500;">Qual seria seu maior gargalo na sua empresa?</label>
  <textarea id="bottleneck" name="bottleneck" rows="2" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>

  <label for="acquisition" style="font-weight: 500;">Como você hoje capta clientes?</label>
  <textarea id="acquisition" name="acquisition" rows="2" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>

  <label for="retention" style="font-weight: 500;">Como você mantém seus clientes comprando recorrente?</label>
  <textarea id="retention" name="retention" rows="2" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>

  <label for="commitmentScore" style="font-weight: 500;">De 0 a 10, quanto você está disposto a dar esse passo para solucionar sua maior dor?</label>
  <input type="number" id="commitmentScore" name="commitmentScore" min="0" max="10" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />

  <label for="message" style="font-weight: 500;">Mensagem</label>
  <textarea id="message" name="message" rows="3" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>

  <!-- Opcional: URL para redirecionar após o envio -->
  <input type="hidden" name="redirectUrl" value="${baseUrl}/" />

  <button type="submit" style="margin-top: 8px; padding: 10px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
    Enviar Contato
  </button>
</form>`;

  const copyToClipboard = async (
    text: string,
    setCopiedState: (v: boolean) => void,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* SEÇÃO DO NOME CUSTOMIZADO DO LINK */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-foreground tracking-tight mb-1">
            Nome do Link
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Escolha um nome curto pro link do formulário. Deixe em branco pra
            usar o padrão do workspace.
          </p>
        </div>

        <form onSubmit={onSaveSlug} className="space-y-2">
          <Label htmlFor="formSlug" className="text-foreground/90 font-medium tracking-tight">
            Nome customizado
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 shadow-sm rounded-md overflow-hidden ring-1 ring-border/50 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <span className="flex items-center px-3 bg-muted/50 text-sm text-muted-foreground h-10 border-r border-border/50 font-medium whitespace-nowrap">
                {baseUrl.replace(/^https?:\/\//, "")}/f/
              </span>
              <Input
                id="formSlug"
                name="formSlug"
                defaultValue={formSlug ?? ""}
                placeholder={workspaceSlug}
                disabled={savingSlug}
                className="h-10 border-0 rounded-none bg-background/50 focus-visible:ring-0 shadow-none flex-1"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={savingSlug} className="gap-2 shrink-0">
              {savingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
          </div>
        </form>

        {slugError && (
          <p className="text-sm text-red-600 dark:text-red-400">{slugError}</p>
        )}
        {slugSaved && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Nome do link salvo.
          </p>
        )}
      </div>

      <div className="border-t border-border/50"></div>

      {/* SEÇÃO DO LINK DIRETO (HOSPEDADO) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-foreground tracking-tight mb-1">
            Link do Formulário
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Página pronta para você enviar aos seus clientes no WhatsApp ou
            E-mail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={hostedFormUrl}
            className="font-mono text-sm text-primary/80"
          />
          <Button
            variant="secondary"
            onClick={() => copyToClipboard(hostedFormUrl, setCopiedLink)}
          >
            {copiedLink ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copiar
          </Button>
          <Button variant="outline" asChild>
            <a href={hostedFormUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir
            </a>
          </Button>
        </div>
      </div>

      <div className="border-t border-border/50"></div>

      {/* SEÇÃO DO CÓDIGO HTML (EMBED) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-foreground tracking-tight mb-1">
            Incorporar no seu Site (Embed)
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Copie o código HTML abaixo e cole no seu site (Wordpress, Wix, ou
            HTML personalizado).
          </p>
        </div>

        <div className="relative group rounded-md bg-muted/50 border overflow-hidden">
          <div className="absolute right-4 top-4 z-10">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shadow-sm"
              onClick={() => copyToClipboard(htmlSnippet, setCopiedHtml)}
            >
              {copiedHtml ? (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                  <Check className="w-3.5 h-3.5" />
                  Copiado
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  Copiar HTML
                </span>
              )}
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs text-foreground/80 font-mono">
            <code>{htmlSnippet}</code>
          </pre>
        </div>

        <div className="rounded-md border p-4 bg-muted/30 mt-6">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            Endpoint da API (Webhook)
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Se você estiver usando um construtor de formulários como Typeform,
            Elementor, ou Make/Zapier, envie uma requisição POST (JSON ou
            FormData) para o endereço abaixo contendo os campos:
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              name
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              email
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              phone
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              companyName
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              marketView
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              bottleneck
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              acquisition
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              retention
            </code>
            ,
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              commitmentScore
            </code>{" "}
            e
            <code className="mx-1 px-1 py-0.5 bg-muted rounded border">
              message
            </code>
            .
          </p>
          <code className="text-xs font-mono bg-card p-2 rounded border block break-all text-primary/80">
            {webhookUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
