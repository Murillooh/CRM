"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Busca de contatos no topbar. Desktop: input sempre visível (com dica ⌘K).
 * Mobile: o input inteiro sumia (hidden md:flex) — zero forma de buscar no
 * celular. Agora vira um botão de lupa que expande um overlay full-width por
 * cima do topbar (item 5 da auditoria de UX).
 */
export function TopbarSearch({ workspaceSlug }: { workspaceSlug: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground"
        aria-label="Buscar contatos"
        onClick={() => setMobileOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <form
          action={`/workspaces/${workspaceSlug}/contacts`}
          className="absolute inset-0 z-20 flex items-center gap-2 bg-background px-4 md:hidden"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus -- abrir a busca e não focar o campo obriga um segundo toque */}
            <Input
              autoFocus
              type="search"
              name="q"
              placeholder="Buscar contatos..."
              aria-label="Buscar contatos"
              className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fechar busca">
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}

      <form action={`/workspaces/${workspaceSlug}/contacts`} className="relative hidden md:flex w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          placeholder="Buscar contatos..."
          aria-label="Buscar contatos"
          className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
        />
        <kbd className="pointer-events-none absolute right-2 top-1.5 hidden select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </form>
    </>
  );
}
