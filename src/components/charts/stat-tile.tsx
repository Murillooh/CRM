import { LucideIcon } from "lucide-react";

/** Stat tile (skill dataviz): label em sentence case, valor em destaque, sem tabular-nums (figura solta, não coluna). */
export function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
