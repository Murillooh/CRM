import { expect, test, describe } from 'vitest';
import { rowsToCsv } from '../csv';

describe('rowsToCsv', () => {
  test('monta header + linhas separadas por vírgula', () => {
    expect(rowsToCsv(['Nome', 'Valor'], [['João', 100], ['Maria', 200]])).toBe(
      'Nome,Valor\r\nJoão,100\r\nMaria,200'
    );
  });

  test('escapa valor com vírgula entre aspas', () => {
    expect(rowsToCsv(['Nome'], [['Silva, João']])).toBe('Nome\r\n"Silva, João"');
  });

  test('escapa aspas internas dobrando-as', () => {
    expect(rowsToCsv(['Nota'], [['Ele disse "oi"']])).toBe('Nota\r\n"Ele disse ""oi"""');
  });

  test('condição negativa: valor null/undefined vira célula vazia, não "null"/"undefined"', () => {
    expect(rowsToCsv(['A', 'B'], [[null, undefined]])).toBe('A,B\r\n,');
  });

  test('condição negativa: sem linhas, só o header', () => {
    expect(rowsToCsv(['A', 'B'], [])).toBe('A,B');
  });
});
