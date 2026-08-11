"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createContact, updateContact } from "@/app/actions/contacts";

type ContactFormValues = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
};

interface ContactDialogProps {
  workspaceSlug: string;
  /** Quando presente, o dialog abre em modo edição pré-preenchido. */
  contact?: ContactFormValues;
  /** Controle externo (usado pelo menu de ações da linha). Se omitido, o dialog controla seu próprio estado com o trigger padrão. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ContactDialog({ workspaceSlug, contact, open: openProp, onOpenChange }: ContactDialogProps) {
  const isEdit = !!contact;
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      if (isEdit) {
        await updateContact(workspaceSlug, contact.id, formData);
      } else {
        await createContact(workspaceSlug, formData);
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(isEdit ? "Erro ao atualizar contato." : "Erro ao criar contato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Contato" : "Adicionar Contato"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do contato abaixo." : "Insira os dados do seu novo contato abaixo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" name="name" required defaultValue={contact?.name} placeholder="João da Silva" disabled={loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} placeholder="joao@exemplo.com" disabled={loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} placeholder="(11) 99999-9999" disabled={loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jobTitle">Cargo</Label>
            <Input id="jobTitle" name="jobTitle" defaultValue={contact?.jobTitle ?? ""} placeholder="Diretor de Vendas" disabled={loading} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Salvar Contato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
