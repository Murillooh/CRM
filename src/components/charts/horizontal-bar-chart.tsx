"use client";

import { useMemo, useState } from "react";
import { niceMax, roundedEndRectPath, formatCompactNumber, formatCompactCurrency } from "./chart-utils";

export interface HorizontalBarDatum {
  label: string;
  value: number;
  /** Rótulo extra opcional embaixo do label (ex: taxa de queda no funil). */
  annotation?: string;
}

interface HorizontalBarChartProps {
  data: HorizontalBarDatum[];
  color?: string;
  barHeight?: number;
  /**
   * Formato do valor exibido na ponta da barra/tooltip. Enum em vez de callback:
   * funções não atravessam a fronteira Server → Client Component (RSC).
   */
  format?: "number" | "currency";
  ariaLabel: string;
}

const FORMATTERS = {
  number: formatCompactNumber,
  currency: formatCompactCurrency,
} as const;

/**
 * Barras horizontais de série única — funil por estágio, ranking por vendedor.
 * Valor direto na ponta da barra (spec: "Bars → value at the tip"), sem legenda
 * (série única, o título do card já diz o que é).
 */
export function HorizontalBarChart({
  data,
  color = "var(--chart-series-1)",
  barHeight = 22,
  format = "number",
  ariaLabel,
}: HorizontalBarChartProps) {
  const valueFormatter = FORMATTERS[format];
  const [tooltip, setTooltip] = useState<{ y: number; label: string; value: string } | null>(null);

  const width = 640;
  const labelColWidth = 140;
  const padding = { top: 8, right: 64, bottom: 8, left: labelColWidth };
  const rowGap = 10;
  const plotWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + data.length * (barHeight + rowGap);

  const maxValue = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sem dados.</p>;
  }

  return (
    <div className="viz-root relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="overflow-visible">
        {data.map((d, i) => {
          const y = padding.top + i * (barHeight + rowGap);
          const barWidth = maxValue > 0 ? (d.value / maxValue) * plotWidth : 0;
          return (
            <g key={d.label}>
              <text x={labelColWidth - 10} y={y + barHeight / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--chart-text-secondary)">
                {d.label}
              </text>
              <path
                d={roundedEndRectPath(padding.left, y, barWidth, barHeight, 4)}
                fill={color}
                onMouseEnter={() => setTooltip({ y, label: d.label, value: valueFormatter(d.value) })}
                onMouseLeave={() => setTooltip(null)}
                className="cursor-pointer"
              />
              <text x={padding.left + barWidth + 8} y={y + barHeight / 2} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="var(--chart-text-primary)">
                {valueFormatter(d.value)}
              </text>
              {d.annotation && (
                <text x={labelColWidth - 10} y={y + barHeight / 2 + 13} textAnchor="end" fontSize={10} fill="var(--chart-text-muted)">
                  {d.annotation}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md whitespace-nowrap font-medium text-popover-foreground"
          style={{ left: `${((labelColWidth + 8) / width) * 100}%`, top: tooltip.y, transform: "translateY(-4px)" }}
        >
          {tooltip.label}: {tooltip.value}
        </div>
      )}
    </div>
  );
}
