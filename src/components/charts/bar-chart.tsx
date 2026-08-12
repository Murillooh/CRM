"use client";

import { useMemo, useState } from "react";
import { niceMax, roundedTopRectPath, formatCompactNumber, formatCompactCurrency } from "./chart-utils";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  label: string;
  values: Record<string, number>;
}

interface TooltipState {
  xPct: number;
  y: number;
  title: string;
  rows: { label: string; value: string; color: string }[];
}

interface BarChartProps {
  data: ChartDataPoint[];
  series: ChartSeries[];
  height?: number;
  /**
   * Formato do valor exibido nos eixos/tooltip. Passar a função de formatação
   * direto como prop quebra em Server Components (funções não são serializáveis
   * pelo RSC) — por isso é um enum resolvido aqui dentro, não um callback.
   */
  format?: "number" | "currency";
  ariaLabel: string;
}

const FORMATTERS = {
  number: formatCompactNumber,
  currency: formatCompactCurrency,
} as const;

/**
 * Barras verticais agrupadas — séries temporais (semana, mês). Ver skill dataviz:
 * barra ≤24px, canto arredondado só no topo, gap de 2px entre barras/grupos,
 * gridline hairline, legenda quando ≥2 séries, tooltip por barra no hover.
 */
export function BarChart({ data, series, height = 220, format = "number", ariaLabel }: BarChartProps) {
  const valueFormatter = FORMATTERS[format];
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const width = 640;
  const padding = { top: 12, right: 12, bottom: 28, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = useMemo(() => {
    const max = Math.max(0, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
    return niceMax(max);
  }, [data, series]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const groupWidth = data.length > 0 ? plotWidth / data.length : 0;
  const barGap = 2;
  const barWidth = Math.max(1, Math.min(24, (groupWidth - barGap * (series.length + 1)) / Math.max(series.length, 1)));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período.</p>;
  }

  return (
    <div className="viz-root relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="overflow-visible">
        {yTicks.map((tick, i) => {
          const y = padding.top + plotHeight - (maxValue > 0 ? (tick / maxValue) * plotHeight : 0);
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--chart-gridline)" strokeWidth={1} />
              <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--chart-text-muted)">
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
          stroke="var(--chart-baseline)"
          strokeWidth={1}
        />

        {data.map((d, gi) => {
          const groupX = padding.left + gi * groupWidth;
          return (
            <g key={d.label}>
              {series.map((s, si) => {
                const value = d.values[s.key] ?? 0;
                const barHeight = maxValue > 0 ? (value / maxValue) * plotHeight : 0;
                const x = groupX + barGap + si * (barWidth + barGap);
                const y = padding.top + plotHeight - barHeight;
                return (
                  <path
                    key={s.key}
                    d={roundedTopRectPath(x, y, barWidth, barHeight, 4)}
                    fill={s.color}
                    onMouseEnter={() =>
                      setTooltip({
                        xPct: ((x + barWidth / 2) / width) * 100,
                        y,
                        title: d.label,
                        rows: [{ label: s.label, value: valueFormatter(value), color: s.color }],
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    className="cursor-pointer"
                  />
                );
              })}
              <text x={groupX + groupWidth / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--chart-text-muted)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md whitespace-nowrap"
          style={{ left: `${tooltip.xPct}%`, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
        >
          <div className="font-medium text-popover-foreground mb-0.5">{tooltip.title}</div>
          {tooltip.rows.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 text-popover-foreground/80">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.label}: {r.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
