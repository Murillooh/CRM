import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { SettingsForm } from "./settings-form";
import { EmailAccountsSection } from "./email-accounts-section";
import { SignatureForm } from "./signature-form";
import { FormsSection } from "./forms-section";
import { RemoveMemberButton } from "./remove-member-button";
import { Shield, Users, Mail, Settings2, LayoutTemplate, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function SettingsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email_connected?: string; email_error?: string; tab?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { user, workspace, role } = await requireWorkspaceAccess(params.slug);

  const [memberships, emailAccounts, me] = await Promise.all([
    db.membership.findMany({
      where: { workspaceId: workspace.id },
      include: { user: true },
      orderBy: { role: 'asc' } // OWNER first, then ADMIN, then MEMBER
    }),
    db.emailAccount.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'asc' },
    }),
    db.user.findUnique({ where: { id: user.id }, select: { emailSignature: true } }),
  ]);

  const banner = searchParams.email_connected
    ? ({ type: "connected" } as const)
    : searchParams.email_error
    ? ({ type: "error", message: searchParams.email_error } as const)
    : null;

  const activeTab = searchParams.tab || 'geral';

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20">
          <Settings2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as informações do seu workspace e equipe.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background/50 relative z-0">
        <div className="flex flex-col md:flex-row h-full w-full">
          
          {/* Navegação Lateral (Menu Esquerdo) */}
          <aside className="w-full md:w-72 shrink-0 border-r border-border/40 bg-card/20 p-6 md:p-8">
            <nav className="flex flex-col gap-2 sticky top-8">
              <h3 className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Configurações
              </h3>
              <Link 
                href={`?tab=geral`} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'geral' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <LayoutTemplate className="w-4 h-4" />
                Geral
              </Link>
              <Link 
                href={`?tab=equipe`} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'equipe' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <Users className="w-4 h-4" />
                Equipe
              </Link>
              <Link 
                href={`?tab=email`} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'email' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <Mail className="w-4 h-4" />
                E-mail
              </Link>
              <Link 
                href={`?tab=formularios`} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'formularios' ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                <FileText className="w-4 h-4" />
                Formulários
              </Link>
            </nav>
          </aside>

          {/* Conteúdo Principal (Lado Direito) */}
          <div className="flex-1 p-6 md:p-12 lg:p-16 animate-in fade-in slide-in-from-right-4 duration-500 overflow-x-hidden">
            <div className="max-w-4xl">
              {/* Sessão Geral */}
              {activeTab === 'geral' && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3 ring-1 ring-primary/20">
                    <LayoutTemplate className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Geral</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Informações básicas sobre este Workspace, incluindo nome e URL de acesso.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                  <SettingsForm workspace={{ name: workspace.name, slug: workspace.slug }} />
                </div>
              </div>
            )}

            {/* Sessão de Membros */}
            {activeTab === 'equipe' && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="inline-flex p-2 rounded-lg bg-blue-500/10 mb-3 ring-1 ring-blue-500/20">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    Membros da Equipe
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Pessoas com acesso a este Workspace. Controle quem pode visualizar ou editar seus negócios.
                  </p>
                </div>
                
                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/30 border-b border-border/50">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Usuário</th>
                          <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Email</th>
                          <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Função</th>
                          <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider w-20 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {memberships.map((m) => (
                          <tr key={m.id} className="group hover:bg-muted/20 transition-all duration-300">
                            <td className="px-6 py-5 font-medium flex items-center gap-4 text-foreground">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-background shadow-inner group-hover:scale-105 transition-transform">
                                {m.user.name.charAt(0).toUpperCase()}
                              </div>
                              {m.user.name}
                            </td>
                            <td className="px-6 py-5 text-muted-foreground">{m.user.email}</td>
                            <td className="px-6 py-5">
                              <Badge 
                                variant={m.role === 'OWNER' ? 'default' : m.role === 'ADMIN' ? 'secondary' : 'outline'} 
                                className={`gap-1.5 px-3 py-1 bg-opacity-20 ${m.role === 'OWNER' ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' : ''}`}
                              >
                                {m.role === 'OWNER' && <Shield className="w-3.5 h-3.5" />}
                                {m.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-5 text-right">
                              {(role === 'OWNER' || role === 'ADMIN') && m.role !== 'OWNER' && m.user.id !== user.id && (
                                <RemoveMemberButton workspaceSlug={workspace.slug} userId={m.user.id} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sessão de E-mail (Módulo 5 — Email Sync) */}
            {activeTab === 'email' && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="inline-flex p-2 rounded-lg bg-rose-500/10 mb-3 ring-1 ring-rose-500/20">
                    <Mail className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    Integração de E-mail
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Conecte sua caixa Gmail para sincronizar e-mails na timeline dos contatos e enviar mensagens direto do CRM.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                    <EmailAccountsSection workspaceSlug={params.slug} accounts={emailAccounts} banner={banner} />
                  </div>

                  <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                    <h4 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Assinatura de E-mail</h4>
                    <div className="relative z-10">
                      <SignatureForm workspaceSlug={params.slug} signature={me?.emailSignature ?? null} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessão de Formulários */}
            {activeTab === 'formularios' && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="inline-flex p-2 rounded-lg bg-emerald-500/10 mb-3 ring-1 ring-emerald-500/20">
                    <FileText className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    Formulários de Captação
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Obtenha o código HTML para incorporar um formulário no seu site. 
                    Novos leads cairão diretamente na primeira etapa do seu funil.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                  <FormsSection workspaceSlug={workspace.slug} />
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
