import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { ContactDialog } from "./contact-dialog";
import { Building2, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function ContactsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const contacts = await db.contact.findMany({
    where: { 
      workspaceId: workspace.id,
      deletedAt: null 
    },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua lista de clientes e contatos.</p>
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
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Nenhum contato encontrado. Crie um novo!
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            {/* Deletar action pode ser feita criando um form ou client component extra, deixaremos no menu por enquanto */}
                            <DropdownMenuItem className="text-red-600">Remover</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
