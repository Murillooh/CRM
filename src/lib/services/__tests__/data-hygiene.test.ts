import { expect, test, describe } from 'vitest';
import { findDuplicateContacts } from '../data-hygiene';

const existing = [
  { id: 'c1', name: 'João Silva', email: 'joao@acme.com' },
  { id: 'c2', name: 'Maria Souza', email: 'maria@outraempresa.com' },
];

describe('findDuplicateContacts', () => {
  test('acha duplicado por nome igual (case-insensitive)', () => {
    const result = findDuplicateContacts({ name: 'JOÃO SILVA', email: 'outro@dominio.com' }, existing);
    expect(result.map((r) => r.id)).toEqual(['c1']);
  });

  test('acha duplicado por domínio de e-mail igual, nome diferente', () => {
    const result = findDuplicateContacts({ name: 'Pedro Costa', email: 'pedro@acme.com' }, existing);
    expect(result.map((r) => r.id)).toEqual(['c1']);
  });

  test('condição negativa: nome e domínio únicos, nenhum duplicado', () => {
    const result = findDuplicateContacts({ name: 'Ana Lima', email: 'ana@novodominio.com' }, existing);
    expect(result).toEqual([]);
  });

  test('condição negativa: sem e-mail e nome único, nenhum duplicado', () => {
    const result = findDuplicateContacts({ name: 'Carlos Rocha', email: null }, existing);
    expect(result).toEqual([]);
  });

  test('condição negativa: lista de existentes vazia, nunca acha duplicado', () => {
    expect(findDuplicateContacts({ name: 'João Silva', email: 'joao@acme.com' }, [])).toEqual([]);
  });
});
