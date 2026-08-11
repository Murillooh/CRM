import { expect, test, describe } from 'vitest';
import { pickRoundRobin, pickByTerritory, pickByCompanySize } from '../lead-routing';

describe('pickRoundRobin', () => {
  test('sem cursor, atribui ao primeiro da lista', () => {
    expect(pickRoundRobin([{ id: 'a' }, { id: 'b' }], null)).toBe('a');
  });

  test('cicla pro próximo após o último atribuído', () => {
    const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(pickRoundRobin(members, 'a')).toBe('b');
    expect(pickRoundRobin(members, 'b')).toBe('c');
  });

  test('dá a volta no fim da lista', () => {
    expect(pickRoundRobin([{ id: 'a' }, { id: 'b' }], 'b')).toBe('a');
  });

  test('condição negativa: cursor de membro que saiu da lista reinicia do primeiro', () => {
    expect(pickRoundRobin([{ id: 'a' }, { id: 'b' }], 'ex-membro')).toBe('a');
  });

  test('condição negativa: sem membros elegíveis, não atribui ninguém', () => {
    expect(pickRoundRobin([], null)).toBeNull();
  });
});

describe('pickByTerritory', () => {
  const members = [
    { id: 'a', region: 'SP' },
    { id: 'b', region: 'RJ' },
    { id: 'c', region: 'SP' },
  ];

  test('escolhe dentro do território do lead', () => {
    expect(pickByTerritory(members, 'RJ', null)).toBe('b');
  });

  test('cicla round-robin dentro do próprio território', () => {
    expect(pickByTerritory(members, 'SP', 'a')).toBe('c');
  });

  test('condição negativa: sem território informado, cai pro round-robin geral', () => {
    expect(pickByTerritory(members, null, null)).toBe('a');
  });

  test('condição negativa: território sem nenhum rep, cai pro round-robin geral', () => {
    expect(pickByTerritory(members, 'MG', null)).toBe('a');
  });
});

describe('pickByCompanySize', () => {
  const tiers = [
    { maxEmployees: 50, assigneeId: 'sdr-pequenas' },
    { maxEmployees: 500, assigneeId: 'ae-medias' },
  ];

  test('escolhe o tier certo pelo porte da empresa', () => {
    expect(pickByCompanySize(tiers, 10, 'fallback')).toBe('sdr-pequenas');
    expect(pickByCompanySize(tiers, 200, 'fallback')).toBe('ae-medias');
  });

  test('funciona com tiers fora de ordem', () => {
    const unordered = [tiers[1], tiers[0]];
    expect(pickByCompanySize(unordered, 10, 'fallback')).toBe('sdr-pequenas');
  });

  test('condição negativa: porte desconhecido usa fallback', () => {
    expect(pickByCompanySize(tiers, null, 'fallback')).toBe('fallback');
  });

  test('condição negativa: porte maior que todos os tiers usa fallback', () => {
    expect(pickByCompanySize(tiers, 10000, 'fallback')).toBe('fallback');
  });
});
