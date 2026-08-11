/**
 * Agendamento e backoff do Email Sync (Módulo 5). Funções puras — o scanner de cron
 * (email-sync-engine.ts) faz as queries e chama isso pra decidir o quê e quando processar.
 */

export interface SyncableAccount {
  id: string;
  nextSyncAt: Date;
  backoffUntil: Date | null;
  status: "CONNECTED" | "ERROR" | "DISCONNECTED";
}

export function isDueForSync(account: SyncableAccount, now: Date): boolean {
  if (account.status === "DISCONNECTED") return false;
  if (account.backoffUntil && account.backoffUntil > now) return false;
  return account.nextSyncAt <= now;
}

/** Cap por tick: protege timeout de função e cota — o resto fica pro próximo tick. */
export function selectAccountsDueForSync<T extends SyncableAccount>(accounts: T[], now: Date, limit: number): T[] {
  return accounts.filter((a) => isDueForSync(a, now)).slice(0, limit);
}

export function computeNextSyncAt(now: Date, intervalMinutes: number): Date {
  return new Date(now.getTime() + intervalMinutes * 60_000);
}

/**
 * Backoff exponencial com jitter (0-30% do valor capado), isolado por conta — uma conta com
 * rate limit não deve atrasar as outras. `rng` é injetável pra deixar o teste determinístico.
 */
export function computeBackoffUntil(
  now: Date,
  attempt: number,
  baseSeconds = 30,
  maxSeconds = 3600,
  rng: () => number = Math.random
): Date {
  const exponential = baseSeconds * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxSeconds);
  const jitter = capped * 0.3 * rng();
  return new Date(now.getTime() + (capped + jitter) * 1000);
}
