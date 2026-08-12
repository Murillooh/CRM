"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { LayoutDashboard, Briefcase, Users, Network, BarChart3, Settings, UserPlus, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ContactDialog } from "@/app/(dashboard)/workspaces/[slug]/contacts/contact-dialog";

/**
 * Command palette global (Cmd/Ctrl+K) — item 1 da auditoria de UX.
 * Navegação entre seções do workspace + ações rápidas. Montado uma vez
 * no layout do workspace, funciona em qualquer página.
 */
export function CommandPalette({ workspaceSlug }: { workspaceSlug: string }) {
  const [open, setOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(`/workspaces/${workspaceSlug}${path}`);
  }

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar ou executar uma ação..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => go("")}>
              <LayoutDashboard /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => go("/deals")}>
              <Briefcase /> Pipeline
            </CommandItem>
            <CommandItem onSelect={() => go("/contacts")}>
              <Users /> Contatos
            </CommandItem>
            <CommandItem onSelect={() => go("/automations")}>
              <Network /> Automações
            </CommandItem>
            <CommandItem onSelect={() => go("/reports")}>
              <BarChart3 /> Relatórios
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings /> Configurações
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações rápidas">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setNewContactOpen(true);
              }}
            >
              <UserPlus /> Novo contato
            </CommandItem>
            <CommandItem onSelect={() => go("/deals")}>
              <Briefcase /> Novo negócio
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Conta">
            <CommandItem onSelect={handleSignOut}>
              <LogOut /> Sair
              <CommandShortcut>⇧⌘Q</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Controlado 100% pelo state acima — sem trigger visível próprio (ver contact-dialog.tsx). */}
      <ContactDialog workspaceSlug={workspaceSlug} open={newContactOpen} onOpenChange={setNewContactOpen} />
    </>
  );
}
