"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, BookmarkPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSavedView, deleteSavedView } from "@/app/actions/saved-views";

type SavedView = { id: string; name: string; query: { q?: string } };

export function SavedViewsBar({
  workspaceSlug,
  views,
  currentQuery,
}: {
  workspaceSlug: string;
  views: SavedView[];
  currentQuery: string;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Já existe uma view salva idêntica à busca atual? Não repete o botão de salvar.
  const alreadySaved = views.some((v) => (v.query?.q || "") === currentQuery);

  function applyView(query: { q?: string }) {
    const q = query?.q?.trim();
    router.push(`/workspaces/${workspaceSlug}/contacts${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createSavedView(workspaceSlug, "contacts", name, { q: currentQuery });
      setName("");
      setSaving(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => deleteSavedView(workspaceSlug, "contacts", id));
  }

  if (views.length === 0 && !currentQuery) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {views.length > 0 && (
        <span className="text-xs font-medium text-muted-foreground shrink-0">Views:</span>
      )}
      {views.map((v) => (
        <span
          key={v.id}
          className="group/view inline-flex items-center gap-1 rounded-full border bg-muted/40 pl-3 pr-1.5 py-1 text-xs"
        >
          <button type="button" onClick={() => applyView(v.query)} className="hover:text-primary font-medium">
            {v.name}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(v.id)}
            disabled={isPending}
            aria-label={`Remover view "${v.name}"`}
            className="opacity-0 group-hover/view:opacity-100 group-focus-within/view:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {currentQuery && !alreadySaved && (
        saving ? (
          <span className="inline-flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da view..."
              className="h-7 text-xs rounded-md border bg-background px-2 w-36 outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setSaving(false);
              }}
            />
            <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleSave} disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Salvar
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSaving(false)}>
              Cancelar
            </Button>
          </span>
        ) : (
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setSaving(true)}>
            <BookmarkPlus className="h-3.5 w-3.5" />
            Salvar filtro atual
          </Button>
        )
      )}
    </div>
  );
}
