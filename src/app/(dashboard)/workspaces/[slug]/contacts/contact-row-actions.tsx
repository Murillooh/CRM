"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactDialog } from "./contact-dialog";
import { deleteContact } from "@/app/actions/contacts";
import { SendEmailDialog } from "@/components/email/send-email-dialog";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
};

export function ContactRowActions({
  workspaceSlug,
  contact,
  emailAccounts = [],
}: {
  workspaceSlug: string;
  contact: Contact;
  emailAccounts?: { id: string; emailAddress: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Remover "${contact.name}"? Essa ação pode ser desfeita pelo suporte, mas o contato some das listagens.`)) {
      return;
    }
    startDeleteTransition(async () => {
      await deleteContact(workspaceSlug, contact.id);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {contact.email && emailAccounts.length > 0 && (
        <SendEmailDialog
          workspaceSlug={workspaceSlug}
          emailAccounts={emailAccounts}
          contactId={contact.id}
          defaultTo={contact.email}
          trigger={
            <Button variant="ghost" className="h-8 w-8 p-0" title="Enviar e-mail">
              <span className="sr-only">Enviar e-mail</span>
              <Mail className="h-4 w-4" />
            </Button>
          }
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
            <span className="sr-only">Abrir menu</span>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Editar</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContactDialog workspaceSlug={workspaceSlug} contact={contact} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
