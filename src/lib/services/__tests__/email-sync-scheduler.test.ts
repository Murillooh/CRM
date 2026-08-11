import { expect, test, describe } from 'vitest';
import { isDueForSync, selectAccountsDueForSync, computeNextSyncAt, computeBackoffUntil } from '../email-sync-scheduler';

const NOW = new Date('2026-08-11T12:00:00Z');

describe('isDueForSync', () => {
  test('conta vencida e sem backoff está due', () => {
    expect(isDueForSync({ id: 'a', nextSyncAt: new Date('2026-08-11T11:00:00Z'), backoffUntil: null, status: 'CONNECTED' }, NOW)).toBe(true);
  });

  test('condição negativa: ainda não venceu', () => {
    expect(isDueForSync({ id: 'a', nextSyncAt: new Date('2026-08-11T13:00:00Z'), backoffUntil: null, status: 'CONNECTED' }, NOW)).toBe(false);
  });

  test('condição negativa: em backoff, mesmo vencida', () => {
    expect(isDueForSync({ id: 'a', nextSyncAt: new Date('2026-08-11T11:00:00Z'), backoffUntil: new Date('2026-08-11T12:30:00Z'), status: 'ERROR' }, NOW)).toBe(false);
  });

  test('condição negativa: conta desconectada nunca está due', () => {
    expect(isDueForSync({ id: 'a', nextSyncAt: new Date('2026-08-11T11:00:00Z'), backoffUntil: null, status: 'DISCONNECTED' }, NOW)).toBe(false);
  });
});

describe('selectAccountsDueForSync', () => {
  const accounts = [
    { id: 'a', nextSyncAt: new Date('2026-08-11T11:00:00Z'), backoffUntil: null, status: 'CONNECTED' as const },
    { id: 'b', nextSyncAt: new Date('2026-08-11T13:00:00Z'), backoffUntil: null, status: 'CONNECTED' as const }, // não vencida
    { id: 'c', nextSyncAt: new Date('2026-08-11T10:00:00Z'), backoffUntil: null, status: 'CONNECTED' as const },
  ];

  test('filtra só as vencidas', () => {
    expect(selectAccountsDueForSync(accounts, NOW, 10).map((a) => a.id)).toEqual(['a', 'c']);
  });

  test('condição negativa: respeita o cap por tick mesmo com mais contas vencidas', () => {
    expect(selectAccountsDueForSync(accounts, NOW, 1).map((a) => a.id)).toEqual(['a']);
  });
});

describe('computeNextSyncAt', () => {
  test('soma o intervalo em minutos', () => {
    expect(computeNextSyncAt(NOW, 10).toISOString()).toBe('2026-08-11T12:10:00.000Z');
  });
});

describe('computeBackoffUntil', () => {
  test('cresce exponencialmente com a tentativa', () => {
    const t0 = computeBackoffUntil(NOW, 0, 30, 3600, () => 0);
    const t1 = computeBackoffUntil(NOW, 1, 30, 3600, () => 0);
    expect(t0.getTime() - NOW.getTime()).toBe(30_000);
    expect(t1.getTime() - NOW.getTime()).toBe(60_000);
  });

  test('condição negativa: nunca passa do teto (maxSeconds), mesmo em tentativas altas', () => {
    const t = computeBackoffUntil(NOW, 20, 30, 3600, () => 0);
    expect(t.getTime() - NOW.getTime()).toBe(3600_000);
  });

  test('jitter fica dentro da faixa 0-30% do valor capado', () => {
    const withMaxJitter = computeBackoffUntil(NOW, 0, 30, 3600, () => 1);
    const diffSeconds = (withMaxJitter.getTime() - NOW.getTime()) / 1000;
    expect(diffSeconds).toBeGreaterThanOrEqual(30);
    expect(diffSeconds).toBeLessThanOrEqual(30 * 1.3);
  });
});
