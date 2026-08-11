import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { SettingsForm } from "./settings-form";
import { EmailAccountsSection } from "./email-accounts-section";
import { SignatureForm } from "./signature-form";
import { Shield, Users, Mail } from "lucide-react";
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
    <div className="flex h-full flex-col">
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as informações do seu workspace e equipe.</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Sessão Geral */}
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="text-lg font-semibold">Geral</h3>
              <p className="text-sm text-muted-foreground">
                Informações básicas sobre este Workspace.
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <SettingsForm workspace={{ name: workspace.name, slug: workspace.slug }} />
            </div>
          </div>

          <hr className="border-border" />

          {/* Sessão de Membros */}
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membros da Equipe
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pessoas com acesso a este Workspace.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium text-muted-foreground">Usuário</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground">Email</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground">Função</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {memberships.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          {m.user.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{m.user.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={m.role === 'OWNER' ? 'default' : m.role === 'ADMIN' ? 'secondary' : 'outline'} className="gap-1">
                            {m.role === 'OWNER' && <Shield className="w-3 h-3" />}
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

          <hr className="border-border" />

          {/* Sessão de E-mail (Módulo 5 — Email Sync) */}
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                E-mail
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte sua caixa Gmail pra sincronizar e-mails na timeline e enviar direto do CRM.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <EmailAccountsSection workspaceSlug={params.slug} accounts={emailAccounts} banner={banner} />
              </div>

              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <h4 className="text-sm font-semibold mb-3">Sua assinatura</h4>
                <SignatureForm workspaceSlug={params.slug} signature={me?.emailSignature ?? null} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
