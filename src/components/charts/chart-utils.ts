/**
 * Helpers compartilhados pelos gráficos (skill dataviz): eixo com números redondos,
 * path de barra com ponta arredondada só na extremidade do dado (reta na baseline —
 * um <rect rx> arredondaria os 4 cantos, por isso path manual).
 */

/** Arredonda pra um "número redondo" de eixo (1/2/5 x potência de 10). */
export function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized: number;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}

/** Barra vertical: cresce da baseline (embaixo) pra cima — canto arredondado só no topo. */
export function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (width <= 0 || height <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  if (r <= 0) return `M${x},${y} h${width} v${height} h${-width} Z`;
  return `M${x},${y + r} a${r},${r} 0 0 1 ${r},${-r} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${height - r} h${-width} Z`;
}

/** Barra horizontal: cresce da baseline (esquerda) pra direita — canto arredondado só na ponta. */
export function roundedEndRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (width <= 0 || height <= 0) return "";
  const r = Math.min(radius, height / 2, width);
  if (r <= 0) return `M${x},${y} v${height} h${width} v${-height} Z`;
  return `M${x},${y} h${width - r} a${r},${r} 0 0 1 ${r},${r} v${height - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(width - r)} Z`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
