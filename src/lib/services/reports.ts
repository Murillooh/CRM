import { db } from "@/lib/db";

/**
 * Queries de agregação dos Relatórios. Tudo em $queryRaw com cast explícito
 * (::int / ::float8) — sem isso o Postgres devolve COUNT/SUM como bigint/numeric,
 * que o node-postgres mapeia pra string/BigInt e quebra a serialização RSC
 * (Server Component -> Client Component) e o JSON do CSV.
 *
 * Cada função é 1-2 queries agregadas no banco — nada de buscar deals e somar em JS.
 */

// -----------------------------------------------------------------------------
// 1. Funil de conversão por estágio
// -----------------------------------------------------------------------------

export interface FunnelStageRow {
  stageId: string;
  stageName: string;
  order: number;
  openCount: number;
}

export interface FunnelOutcomeRow {
  status: "OPEN" | "WON" | "LOST";
  count: number;
  totalValue: number;
}

export async function getFunnelReport(workspaceId: string, pipelineId: string) {
  const [stages, outcomes] = await Promise.all([
    db.$queryRaw<FunnelStageRow[]>`
      SELECT
        ps.id::text as "stageId",
        ps.name as "stageName",
        ps."order" as "order",
        COUNT(d.id) FILTER (WHERE d.status = 'OPEN')::int as "openCount"
      FROM pipeline_stages ps
      LEFT JOIN deals d ON d.stage_id = ps.id AND d.deleted_at IS NULL
      WHERE ps.workspace_id = ${workspaceId} AND ps.pipeline_id = ${pipelineId}
      GROUP BY ps.id, ps.name, ps."order"
      ORDER BY ps."order" ASC
    `,
    db.$queryRaw<FunnelOutcomeRow[]>`
      SELECT
        status::text as status,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0)::float8 as "totalValue"
      FROM deals
      WHERE workspace_id = ${workspaceId} AND pipeline_id = ${pipelineId} AND deleted_at IS NULL
      GROUP BY status
    `,
  ]);

  return { stages, outcomes };
}

// -----------------------------------------------------------------------------
// 2. Forecast de receita (deals abertos ponderados por probabilidade x valor)
// -----------------------------------------------------------------------------

export interface ForecastByStageRow {
  stageId: string;
  stageName: string;
  order: number;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
}

export interface ForecastByMonthRow {
  month: string; // "YYYY-MM"
  dealCount: number;
  weightedValue: number;
}

export async function getRevenueForecast(workspaceId: string, pipelineId: string) {
  const [byStage, byMonth] = await Promise.all([
    db.$queryRaw<ForecastByStageRow[]>`
      SELECT
        ps.id::text as "stageId",
        ps.name as "stageName",
        ps."order" as "order",
        COUNT(d.id)::int as "dealCount",
        COALESCE(SUM(d.value), 0)::float8 as "totalValue",
        COALESCE(SUM(d.value * COALESCE(d.probability, 0) / 100.0), 0)::float8 as "weightedValue"
      FROM pipeline_stages ps
      LEFT JOIN deals d ON d.stage_id = ps.id AND d.status = 'OPEN' AND d.deleted_at IS NULL
      WHERE ps.workspace_id = ${workspaceId} AND ps.pipeline_id = ${pipelineId}
      GROUP BY ps.id, ps.name, ps."order"
      ORDER BY ps."order" ASC
    `,
    db.$queryRaw<ForecastByMonthRow[]>`
      SELECT
        to_char(date_trunc('month', COALESCE(d.expected_close_date, d.created_at)), 'YYYY-MM') as month,
        COUNT(*)::int as "dealCount",
        COALESCE(SUM(d.value * COALESCE(d.probability, 0) / 100.0), 0)::float8 as "weightedValue"
      FROM deals d
      WHERE d.workspace_id = ${workspaceId} AND d.status = 'OPEN' AND d.deleted_at IS NULL
      GROUP BY month
      ORDER BY month ASC
    `,
  ]);

  return { byStage, byMonth };
}

// -----------------------------------------------------------------------------
// 3. Performance por vendedor
// -----------------------------------------------------------------------------

export interface SalesPerformanceRow {
  ownerId: string;
  ownerName: string;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  avgCycleDays: number;
}

export async function getSalesPerformance(workspaceId: string) {
  return db.$queryRaw<SalesPerformanceRow[]>`
    SELECT
      d.owner_id as "ownerId",
      COALESCE(u.name, 'Sem responsável') as "ownerName",
      COUNT(*) FILTER (WHERE d.status = 'WON')::int as "wonCount",
      COUNT(*) FILTER (WHERE d.status = 'LOST')::int as "lostCount",
      COALESCE(SUM(d.value) FILTER (WHERE d.status = 'WON'), 0)::float8 as "wonValue",
      COALESCE(
        AVG(EXTRACT(EPOCH FROM (d.closed_at - d.created_at)) / 86400.0)
          FILTER (WHERE d.status = 'WON' AND d.closed_at IS NOT NULL),
        0
      )::float8 as "avgCycleDays"
    FROM deals d
    LEFT JOIN users u ON u.id = d.owner_id
    WHERE d.workspace_id = ${workspaceId}
      AND d.deleted_at IS NULL
      AND d.owner_id IS NOT NULL
      AND d.status IN ('WON', 'LOST')
    GROUP BY d.owner_id, u.name
    ORDER BY "wonValue" DESC
  `;
}

// -----------------------------------------------------------------------------
// 4. Atividade por período (ligações/e-mails/tarefas por semana)
// -----------------------------------------------------------------------------

interface ActivityByWeekRow {
  week: string; // "YYYY-MM-DD" (segunda-feira da semana)
  type: string;
  count: number;
}

interface TaskByWeekRow {
  week: string;
  count: number;
}

export interface ActivityWeek {
  week: string;
  calls: number;
  emails: number;
  tasks: number;
}

export async function getActivityByWeek(workspaceId: string, since: Date): Promise<ActivityWeek[]> {
  const [activityRows, taskRows] = await Promise.all([
    db.$queryRaw<ActivityByWeekRow[]>`
      SELECT
        to_char(date_trunc('week', a.created_at), 'YYYY-MM-DD') as week,
        a.type::text as type,
        COUNT(*)::int as count
      FROM activities a
      WHERE a.workspace_id = ${workspaceId} AND a.created_at >= ${since} AND a.type IN ('CALL', 'EMAIL')
      GROUP BY week, a.type
      ORDER BY week ASC
    `,
    db.$queryRaw<TaskByWeekRow[]>`
      SELECT
        to_char(date_trunc('week', t.created_at), 'YYYY-MM-DD') as week,
        COUNT(*)::int as count
      FROM tasks t
      WHERE t.workspace_id = ${workspaceId} AND t.created_at >= ${since}
      GROUP BY week
      ORDER BY week ASC
    `,
  ]);

  // Merge em memória — 2 conjuntos já pequenos e pré-agregados no banco, não é N+1.
  const weeks = new Map<string, ActivityWeek>();
  const getWeek = (week: string) => {
    let entry = weeks.get(week);
    if (!entry) {
      entry = { week, calls: 0, emails: 0, tasks: 0 };
      weeks.set(week, entry);
    }
    return entry;
  };

  for (const row of activityRows) {
    const entry = getWeek(row.week);
    if (row.type === "CALL") entry.calls = row.count;
    if (row.type === "EMAIL") entry.emails = row.count;
  }
  for (const row of taskRows) {
    getWeek(row.week).tasks = row.count;
  }

  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week));
}
