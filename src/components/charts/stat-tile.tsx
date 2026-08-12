import { LucideIcon } from "lucide-react";

/**
 * Stat tile (skill dataviz): label em sentence case, valor em destaque, sem
 * tabular-nums (figura solta, não coluna). `tone` é uma cor CSS (ex: um token
 * var(--chart-series-1)) opcional — colore o badge do ícone; sem ela, ícone
 * fica neutro/muted como antes.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={
              tone
                ? { backgroundColor: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }
                : undefined
            }
          >
            <Icon className={tone ? "h-4 w-4" : "h-4 w-4 text-muted-foreground"} />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
