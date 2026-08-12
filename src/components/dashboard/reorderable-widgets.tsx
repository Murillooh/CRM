"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

const STORAGE_KEY = "crm.dashboard.widgetOrder";

/**
 * Dashboard com widgets reorganizáveis (item 12 da auditoria de UX) — HTML5
 * drag-and-drop nativo (mesmo padrão já usado no Kanban de Deals, sem lib
 * nova). Ordem é preferência de UI, persistida só no navegador; se a lista de
 * widgets mudar no futuro (novo card adicionado/removido), a ordem salva é
 * ignorada e volta pro default — evita ordem quebrada/incompleta.
 */
export function ReorderableWidgets({ widgets }: { widgets: { id: string; node: ReactNode }[] }) {
  const defaultOrder = widgets.map((w) => w.id);
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: string[] = JSON.parse(raw);
        if (saved.length === defaultOrder.length && saved.every((id) => defaultOrder.includes(id))) {
          setOrder(saved);
        }
      }
    } catch {
      // localStorage indisponível — segue com o default, sem quebrar a tela.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: string[]) {
    setOrder(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // idem — falha silenciosa, ordem só não persiste entre sessões.
    }
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    persist(next);
    setDragId(null);
  }

  const byId = Object.fromEntries(widgets.map((w) => [w.id, w.node]));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {order.map((id) => (
        <div
          key={id}
          draggable
          onDragStart={() => setDragId(id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(id)}
          onDragEnd={() => setDragId(null)}
          className={`group relative cursor-grab active:cursor-grabbing transition-opacity ${dragId === id ? "opacity-40" : ""}`}
        >
          <span
            className="absolute -top-2 -left-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm group-hover:flex"
            aria-hidden="true"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          {byId[id]}
        </div>
      ))}
    </div>
  );
}
