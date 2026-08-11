import { expect, test, describe } from 'vitest';
import { daysBetween, resolveTaskAssignee, shouldNotifyManager } from '../deal-stall';

describe('daysBetween', () => {
  test('conta dias inteiros corridos', () => {
    const from = new Date('2026-08-01T10:00:00Z');
    const to = new Date('2026-08-06T09:00:00Z'); // quase 5 dias, ainda não fechou o 5º
    expect(daysBetween(from, to)).toBe(4);
  });

  test('condição negativa: menos de 1 dia arredonda pra 0, não conta como parado', () => {
    const from = new Date('2026-08-01T10:00:00Z');
    const to = new Date('2026-08-01T20:00:00Z');
    expect(daysBetween(from, to)).toBe(0);
  });
});

describe('resolveTaskAssignee', () => {
  test('assignTo OWNER resolve pro ownerId do evento', () => {
    expect(resolveTaskAssignee({ assignTo: 'OWNER' }, { ownerId: 'user-1' })).toBe('user-1');
  });

  test('sem assignTo, usa assigneeId literal do payload', () => {
    expect(resolveTaskAssignee({ assigneeId: 'user-2' }, { ownerId: 'user-1' })).toBe('user-2');
  });

  test('condição negativa: assignTo OWNER mas deal sem responsável, não atribui ninguém', () => {
    expect(resolveTaskAssignee({ assignTo: 'OWNER' }, { ownerId: null })).toBeNull();
  });

  test('condição negativa: sem assignTo e sem assigneeId, não atribui ninguém', () => {
    expect(resolveTaskAssignee({}, { ownerId: 'user-1' })).toBeNull();
  });
});

describe('shouldNotifyManager', () => {
  test('escalona quando atinge o limiar N + M', () => {
    expect(shouldNotifyManager(12, 10)).toBe(true);
    expect(shouldNotifyManager(10, 10)).toBe(true);
  });

  test('condição negativa: ainda não atingiu o limiar, não escalona', () => {
    expect(shouldNotifyManager(9, 10)).toBe(false);
  });
});
