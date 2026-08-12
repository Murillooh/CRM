"use client";

import { useMemo, useState, useTransition } from "react";
import { Building2, Mail, Phone, Trash2, UserCog, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ContactRowActions } from "./contact-row-actions";
import { bulkAssignContacts, bulkDeleteContacts } from "@/app/actions/contacts";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: { name: string } | null;
};

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ContactsTable({
  workspaceSlug,
  contacts,
  emailAccounts,
  members,
}: {
  workspaceSlug: string;
  contacts: Contact[];
  emailAccounts: { id: string; emailAddress: string }[];
  members: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigneeId, setAssigneeId] = useState("");
  const [isPending, startTransition] = useTransition();

  const allSelected = contacts.length > 0 && selected.size === contacts.length;
  const someSelected = selected.size > 0 && !allSelected;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkDelete() {
    if (!confirm(`Remover ${selectedIds.length} contato${selectedIds.length === 1 ? "" : "s"}? Essa ação pode ser desfeita pelo suporte, mas eles somem das listagens.`)) {
      return;
    }
    startTransition(async () => {
      await bulkDeleteContacts(workspaceSlug, selectedIds);
      clearSelection();
    });
  }

  function handleBulkAssign() {
    if (!assigneeId) return;
    startTransition(async () => {
      await bulkAssignContacts(workspaceSlug, selectedIds, assigneeId === "unassign" ? null : assigneeId);
      setAssigneeId("");
      clearSelection();
    });
  }

  return (
    <div className="space-y-3">
      {/* Barra de ações em lote — só aparece com seleção ativa (item 2 da auditoria de UX). */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selecionado{selected.size === 1 ? "" : "s"}
          </span>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <select
              className={selectClass}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={isPending}
            >
              <option value="">Atribuir a...</option>
              <option value="unassign">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleBulkAssign} disabled={isPending || !assigneeId} className="gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              Aplicar
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={isPending} className="gap-1.5 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Excluir
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} disabled={isPending} className="ml-auto gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b border-border/40 bg-muted/30">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 pl-6 pr-2 align-middle w-[44px]">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todos os contatos"
                  />
                </th>
                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground w-[300px]">Contato</th>
                <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Informações</th>
                <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground">Cargo / Empresa</th>
                <th className="h-12 px-6 align-middle w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {contacts.map((contact) => {
                const isSelected = selected.has(contact.id);
                return (
                  <tr
                    key={contact.id}
                    data-state={isSelected ? "selected" : undefined}
                    className="group border-b border-border/40 transition-all hover:bg-muted/40 data-[state=selected]:bg-primary/5"
                  >
                    <td className="pl-6 pr-2 py-4 align-middle">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(contact.id)}
                        aria-label={`Selecionar ${contact.name}`}
                      />
                    </td>
                    <td className="px-4 py-4 align-middle">
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
                        <ContactRowActions workspaceSlug={workspaceSlug} contact={contact} emailAccounts={emailAccounts} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
