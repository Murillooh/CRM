import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { ContactDialog } from "./contact-dialog";
import { ContactRowActions } from "./contact-row-actions";
import { Building2, Mail, Phone, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
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

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-md border bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contato</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cargo / Empresa</th>
                  <th className="h-12 px-4 align-middle w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      {query ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <SearchX className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Nenhum contato para &quot;{query}&quot;</p>
                            <p className="text-sm text-muted-foreground mt-1">Revise a busca ou limpe o filtro.</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/workspaces/${params.slug}/contacts`}>Limpar busca</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Nenhum contato ainda</p>
                            <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro contato pra começar a organizar seus clientes.</p>
                          </div>
                          <ContactDialog workspaceSlug={params.slug} />
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">
                        {contact.name}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        <div className="flex flex-col gap-1 text-xs">
                          {contact.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>
                          )}
                          {!contact.email && !contact.phone && "-"}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        <div className="flex flex-col gap-1 text-xs">
                          {contact.jobTitle && <span>{contact.jobTitle}</span>}
                          {contact.company && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Building2 className="h-3 w-3" /> {contact.company.name}
                            </span>
                          )}
                          {!contact.jobTitle && !contact.company && "-"}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <ContactRowActions workspaceSlug={params.slug} contact={contact} emailAccounts={emailAccounts} />
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
