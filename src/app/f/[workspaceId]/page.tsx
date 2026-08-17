"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Building2 } from "lucide-react";

export default function HostedFormPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/webhooks/forms/${workspaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar o formulário");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mensagem Enviada!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Recebemos o seu contato com sucesso. Nossa equipe entrará em contato em breve.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSuccess(false)}
          >
            Enviar nova mensagem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        {/* Header (Poderia carregar a logo do DB) */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary text-primary-foreground rounded-2xl shadow-lg items-center justify-center mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fale Conosco</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Preencha o formulário abaixo e entraremos em contato.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="Seu nome"
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                placeholder="seu.email@exemplo.com"
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                placeholder="(00) 00000-0000"
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                placeholder="Sua empresa"
                className="bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Como podemos ajudar?</Label>
              <Textarea 
                id="message" 
                name="message" 
                rows={4} 
                placeholder="Escreva sua mensagem aqui..."
                className="bg-slate-50 dark:bg-slate-950 resize-none"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Mensagem"
              )}
            </Button>
          </form>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Protegido e alimentado por <strong>CRM</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
