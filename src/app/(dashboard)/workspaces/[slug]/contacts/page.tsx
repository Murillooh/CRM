import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { ContactDialog } from "./contact-dialog";
import { ContactsTable } from "./contacts-table";
import { SavedViewsBar } from "./saved-views-bar";
import { User } from "lucide-react";

export default async function ContactsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const query = searchParams.q?.trim() || "";
  const { user, workspace } = await requireWorkspaceAccess(params.slug);

  const [contacts, emailAccounts, memberships, savedViews] = await Promise.all([
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
    db.membership.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true } } },
    }),
    db.savedView.findMany({
      where: { workspaceId: workspace.id, userId: user.id, entityType: "contacts" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const members = memberships.map((m) => ({ id: m.user.id, name: m.user.name }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between">
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
        <SavedViewsBar
          workspaceSlug={params.slug}
          currentQuery={query}
          views={savedViews.map((v) => ({ id: v.id, name: v.name, query: v.query as { q?: string } }))}
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {contacts.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {query ? `Nenhum contato para "${query}"` : "Nenhum contato ainda"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {query ? "Revise a busca ou limpe o filtro." : "Adicione o primeiro contato pra começar a organizar seus clientes."}
                </p>
              </div>
              <div className="mt-2">
                {query ? (
                  <a href={`/workspaces/${params.slug}/contacts`} className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
                    Limpar busca
                  </a>
                ) : (
                  <ContactDialog workspaceSlug={params.slug} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <ContactsTable
            workspaceSlug={params.slug}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              jobTitle: c.jobTitle,
              company: c.company ? { name: c.company.name } : null,
            }))}
            emailAccounts={emailAccounts}
            members={members}
          />
        )}
      </div>
    </div>
  );
}
