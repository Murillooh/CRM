import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { getFunnelReport, getRevenueForecast, getSalesPerformance, getActivityByWeek } from "@/lib/services/reports";
import { computeDropOffRate, computeWinRate } from "@/lib/services/report-math";
import { BarChart } from "@/components/charts/bar-chart";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { StatTile } from "@/components/charts/stat-tile";
import { ExportCsvButton } from "@/components/charts/export-csv-button";
import { formatCompactNumber } from "@/components/charts/chart-utils";
import { Filter, TrendingUp, Trophy, XCircle, Users, Activity, BarChart3 } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

export default async function ReportsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { workspace } = await requireWorkspaceAccess(params.slug);

  const pipeline = await db.pipeline.findFirst({ where: { workspaceId: workspace.id } });

  if (!pipeline) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Sem dados pra relatório ainda</h2>
        <p className="text-muted-foreground max-w-sm">Crie um funil e alguns negócios primeiro — os relatórios aparecem aqui automaticamente.</p>
      </div>
    );
  }

  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 86_400_000);

  const [funnel, forecast, performance, activity] = await Promise.all([
    getFunnelReport(workspace.id, pipeline.id),
    getRevenueForecast(workspace.id, pipeline.id),
    getSalesPerformance(workspace.id),
    getActivityByWeek(workspace.id, twelveWeeksAgo),
  ]);

  // --- Funil ---
  const funnelBars = funnel.stages.map((stage, i) => {
    const prevCount = i > 0 ? funnel.stages[i - 1].openCount : stage.openCount;
    const dropOff = i > 0 ? computeDropOffRate(prevCount, stage.openCount) : 0;
    return {
      label: stage.stageName,
      value: stage.openCount,
      annotation: i > 0 ? `-${(dropOff * 100).toFixed(0)}% vs. anterior` : undefined,
    };
  });
  const outcomeMap = Object.fromEntries(funnel.outcomes.map((o) => [o.status, o]));
  const wonCount = outcomeMap.WON?.count ?? 0;
  const lostCount = outcomeMap.LOST?.count ?? 0;

  // --- Forecast ---
  const totalWeighted = forecast.byStage.reduce((sum, s) => sum + s.weightedValue, 0);
  const totalOpenValue = forecast.byStage.reduce((sum, s) => sum + s.totalValue, 0);
  const forecastChartData = forecast.byMonth.map((m) => ({
    label: new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
    values: { weighted: m.weightedValue },
  }));

  // --- Performance ---
  const performanceRows = performance.map((p) => ({
    ...p,
    winRate: computeWinRate(p.wonCount, p.lostCount),
  }));
  const performanceChartData = performanceRows
    .filter((p) => p.wonValue > 0)
    .map((p) => ({ label: p.ownerName, value: p.wonValue }));

  // --- Atividade ---
  const activityChartData = activity.map((w) => ({
    label: formatWeekLabel(w.week),
    values: { calls: w.calls, emails: w.emails, tasks: w.tasks },
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Funil, forecast, performance por vendedor e atividade — {pipeline.name}.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* 1. Funil de conversão */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Funil de conversão por estágio
            </h2>
            <ExportCsvButton
              filename="funil-conversao"
              headers={["Estágio", "Negócios abertos", "Queda vs. estágio anterior"]}
              rows={funnelBars.map((b) => [b.label, b.value, b.annotation ?? "-"])}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatTile label="Negócios abertos no funil" value={formatCompactNumber(funnel.stages.reduce((s, st) => s + st.openCount, 0))} icon={Filter} />
            <StatTile label="Ganhos" value={formatCompactNumber(wonCount)} icon={Trophy} />
            <StatTile label="Perdidos" value={formatCompactNumber(lostCount)} icon={XCircle} />
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <HorizontalBarChart data={funnelBars} format="number" ariaLabel="Funil de conversão por estágio" />
          </div>
        </section>

        {/* 2. Forecast de receita */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Forecast de receita
            </h2>
            <ExportCsvButton
              filename="forecast-receita"
              headers={["Mês", "Negócios", "Valor ponderado"]}
              rows={forecast.byMonth.map((m) => [m.month, m.dealCount, m.weightedValue.toFixed(2)])}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StatTile label="Valor em aberto (não ponderado)" value={currencyFormatter.format(totalOpenValue)} icon={TrendingUp} />
            <StatTile label="Forecast ponderado (valor × probabilidade)" value={currencyFormatter.format(totalWeighted)} icon={TrendingUp} />
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <BarChart
              data={forecastChartData}
              series={[{ key: "weighted", label: "Forecast ponderado", color: "var(--chart-series-1)" }]}
              format="currency"
              ariaLabel="Forecast de receita ponderado por mês de fechamento esperado"
            />
          </div>
        </section>

        {/* 3. Performance por vendedor */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Performance por vendedor
            </h2>
            <ExportCsvButton
              filename="performance-vendedores"
              headers={["Vendedor", "Ganhos", "Perdidos", "Taxa de ganho", "Ciclo médio (dias)", "Valor ganho"]}
              rows={performanceRows.map((p) => [
                p.ownerName,
                p.wonCount,
                p.lostCount,
                `${(p.winRate * 100).toFixed(0)}%`,
                p.avgCycleDays.toFixed(1),
                p.wonValue.toFixed(2),
              ])}
            />
          </div>

          {performanceRows.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum negócio fechado (ganho ou perdido) ainda.
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <HorizontalBarChart data={performanceChartData} color="var(--chart-series-3)" format="currency" ariaLabel="Valor ganho por vendedor" />
              </div>
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Vendedor</th>
                        <th className="px-4 py-3 text-right font-medium">Ganhos</th>
                        <th className="px-4 py-3 text-right font-medium">Perdidos</th>
                        <th className="px-4 py-3 text-right font-medium">Taxa de ganho</th>
                        <th className="px-4 py-3 text-right font-medium">Ciclo médio</th>
                        <th className="px-4 py-3 text-right font-medium">Valor ganho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {performanceRows.map((p) => (
                        <tr key={p.ownerId} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{p.ownerName}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{p.wonCount}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{p.lostCount}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{(p.winRate * 100).toFixed(0)}%</td>
                          <td className="px-4 py-3 text-right tabular-nums">{p.avgCycleDays.toFixed(1)} dias</td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">{currencyFormatter.format(p.wonValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 4. Atividade por período */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Atividade por período (últimas 12 semanas)
            </h2>
            <ExportCsvButton
              filename="atividade-por-semana"
              headers={["Semana", "Ligações", "E-mails", "Tarefas"]}
              rows={activity.map((w) => [w.week, w.calls, w.emails, w.tasks])}
            />
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <BarChart
              data={activityChartData}
              series={[
                { key: "calls", label: "Ligações", color: "var(--chart-series-1)" },
                { key: "emails", label: "E-mails", color: "var(--chart-series-2)" },
                { key: "tasks", label: "Tarefas", color: "var(--chart-series-3)" },
              ]}
              format="number"
              ariaLabel="Atividade por semana: ligações, e-mails e tarefas"
            />
          </div>
          {/* Tabela: 2 das 3 séries ficam abaixo de 3:1 de contraste no modo claro (aqua/amarelo sobre fundo claro) — mitigação exigida pela skill de dataviz é ter os valores visíveis fora da cor. */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Semana</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ligações</th>
                    <th className="px-4 py-2.5 text-right font-medium">E-mails</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tarefas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activity.map((w) => (
                    <tr key={w.week} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium">{formatWeekLabel(w.week)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{w.calls}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{w.emails}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{w.tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
