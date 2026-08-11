import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { SettingsForm } from "./settings-form";
import { EmailAccountsSection } from "./email-accounts-section";
import { SignatureForm } from "./signature-form";
import { Shield, Users, Mail, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email_connected?: string; email_error?: string }>;
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

  return (
    <div className="flex h-full flex-col relative overflow-hidden bg-background">
      {/* Elementos de background decorativos (Glow) */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="p-8 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-10 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20">
          <Settings2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as informações do seu workspace e equipe.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-10 relative z-0">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Sessão Geral */}
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">Geral</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Informações básicas sobre este Workspace, incluindo nome e URL de acesso.
              </p>
            </div>
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 ring-1 ring-white/5 transition-all hover:bg-card/60">
              <SettingsForm workspace={{ name: workspace.name, slug: workspace.slug }} />
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          {/* Sessão de Membros */}
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-blue-500/10 mb-3 ring-1 ring-blue-500/20">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">
                Membros da Equipe
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Pessoas com acesso a este Workspace. Controle quem pode visualizar ou editar seus negócios.
              </p>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5 ring-1 ring-white/5 transition-all hover:bg-card/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Usuário</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Email</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider">Função</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          {/* Sessão de E-mail (Módulo 5 — Email Sync) */}
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="inline-flex p-2 rounded-lg bg-rose-500/10 mb-3 ring-1 ring-rose-500/20">
                <Mail className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">
                Integração de E-mail
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Conecte sua caixa Gmail para sincronizar e-mails na timeline dos contatos e enviar mensagens direto do CRM.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 ring-1 ring-white/5 transition-all hover:bg-card/60">
                <EmailAccountsSection workspaceSlug={params.slug} accounts={emailAccounts} banner={banner} />
              </div>

              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 ring-1 ring-white/5 transition-all hover:bg-card/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                <h4 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Assinatura de E-mail</h4>
                <div className="relative z-10">
                  <SignatureForm workspaceSlug={params.slug} signature={me?.emailSignature ?? null} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
