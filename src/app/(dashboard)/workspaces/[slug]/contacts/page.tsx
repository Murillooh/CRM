import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { ContactDialog } from "./contact-dialog";
import { ContactRowActions } from "./contact-row-actions";
import { Building2, Mail, Phone, SearchX, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ContactsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const query = searchParams.q?.trim() || "";
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const [contacts, emailAccounts] = await Promise.all([
    db.contact.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { name: { contains: query, mode: "insensitive" } } },
          ],
        }),
      },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    }),
    db.emailAccount.findMany({
      where: { workspaceId: workspace.id, status: "CONNECTED" },
      select: { id: true, emailAddress: true },
    }),
  ]);

  return (
    <div className="flex h-full flex-col bg-background/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

      <div className="flex items-center justify-between p-6 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? (
              <>Resultados para &quot;{query}&quot; &middot; {contacts.length} encontrado{contacts.length === 1 ? "" : "s"}</>
            ) : (
              "Gerencie sua lista de clientes e contatos."
            )}
          </p>
        </div>
        <ContactDialog workspaceSlug={params.slug} />
      </div>

      <div className="flex-1 overflow-auto p-6 relative z-0">
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border/40 bg-muted/30">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground w-[300px]">Contato</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Informações</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Cargo / Empresa</th>
                  <th className="h-12 px-6 align-middle w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      {query ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                            <SearchX className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-foreground">Nenhum contato para &quot;{query}&quot;</p>
                            <p className="text-sm text-muted-foreground mt-1">Revise a busca ou limpe o filtro.</p>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href={`/workspaces/${params.slug}/contacts`}>Limpar busca</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-foreground">Nenhum contato ainda</p>
                            <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro contato pra começar a organizar seus clientes.</p>
                          </div>
                          <div className="mt-2">
                            <ContactDialog workspaceSlug={params.slug} />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="group border-b border-border/40 transition-all hover:bg-muted/40 data-[state=selected]:bg-muted">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {contact.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col gap-2 text-xs">
                          {contact.email && (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" /> 
                              <a href={`mailto:${contact.email}`} className="hover:text-primary hover:underline">{contact.email}</a>
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" /> 
                              <a href={`tel:${contact.phone}`} className="hover:text-primary hover:underline">{contact.phone}</a>
                            </span>
                          )}
                          {!contact.email && !contact.phone && <span className="text-muted-foreground/50 italic">Sem informações de contato</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col items-start gap-2 text-xs">
                          {contact.jobTitle ? (
                            <span className="font-medium text-muted-foreground">{contact.jobTitle}</span>
                          ) : null}
                          {contact.company ? (
                            <Badge variant="secondary" className="flex items-center gap-1.5 font-medium bg-muted/50 border-border/50 text-foreground">
                              <Building2 className="h-3 w-3 text-primary/70" /> {contact.company.name}
                            </Badge>
                          ) : null}
                          {!contact.jobTitle && !contact.company && <span className="text-muted-foreground/50">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ContactRowActions workspaceSlug={params.slug} contact={contact} emailAccounts={emailAccounts} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
