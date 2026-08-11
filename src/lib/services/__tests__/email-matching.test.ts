import { expect, test, describe } from 'vitest';
import { extractDomain, matchAddress, findRelevantMatch } from '../email-matching';

const contacts = [
  { id: 'c1', email: 'joao@acme.com' },
  { id: 'c2', email: null },
];
const companies = [
  { id: 'co1', domain: 'acme.com' },
  { id: 'co2', domain: null },
];

describe('extractDomain', () => {
  test('extrai o domínio em minúsculo', () => {
    expect(extractDomain('Joao@ACME.com')).toBe('acme.com');
  });

  test('condição negativa: sem @ não extrai nada', () => {
    expect(extractDomain('nao-e-email')).toBeNull();
  });
});

describe('matchAddress', () => {
  test('bate por e-mail exato do contato, case-insensitive', () => {
    expect(matchAddress('JOAO@ACME.COM', contacts, companies)).toEqual({ type: 'Contact', id: 'c1' });
  });

  test('sem contato, cai pro domínio da empresa', () => {
    expect(matchAddress('outra-pessoa@acme.com', contacts, companies)).toEqual({ type: 'Company', id: 'co1' });
  });

  test('contato tem prioridade sobre empresa quando os dois batem', () => {
    // joao@acme.com bate tanto no contato c1 quanto no domínio de co1 -> contato vence
    expect(matchAddress('joao@acme.com', contacts, companies)).toEqual({ type: 'Contact', id: 'c1' });
  });

  test('condição negativa: endereço fora da base não bate em nada', () => {
    expect(matchAddress('estranho@outraempresa.com', contacts, companies)).toBeNull();
  });

  test('condição negativa: string vazia não bate em nada', () => {
    expect(matchAddress('  ', contacts, companies)).toBeNull();
  });
});

describe('findRelevantMatch', () => {
  test('acha o primeiro endereço relevante numa lista de participantes', () => {
    expect(findRelevantMatch(['desconhecido@x.com', 'joao@acme.com'], contacts, companies)).toEqual({ type: 'Contact', id: 'c1' });
  });

  test('condição negativa: nenhum participante bate -> null (mensagem não vira Activity)', () => {
    expect(findRelevantMatch(['a@x.com', 'b@y.com'], contacts, companies)).toBeNull();
  });
});
