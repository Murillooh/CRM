/**
 * Cálculos derivados dos Relatórios. Funções puras — a agregação pesada roda no banco
 * (reports.ts, via $queryRaw); isso aqui só transforma números já agregados.
 */

/** Taxa de queda entre 2 estágios consecutivos do funil (0 a 1). Sem gente no estágio anterior -> 0, não divide por zero. */
export function computeDropOffRate(fromCount: number, toCount: number): number {
  if (fromCount <= 0) return 0;
  return Math.max(0, (fromCount - toCount) / fromCount);
}

/** Taxa de ganho (won / (won + lost)), 0 a 1. Sem negócio fechado ainda -> 0. */
export function computeWinRate(wonCount: number, lostCount: number): number {
  const total = wonCount + lostCount;
  if (total <= 0) return 0;
  return wonCount / total;
}
