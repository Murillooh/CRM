import { expect, test, describe } from 'vitest';
import { niceMax, roundedTopRectPath, roundedEndRectPath } from '../chart-utils';

describe('niceMax', () => {
  test('arredonda pra 1/2/5 x potência de 10', () => {
    expect(niceMax(43)).toBe(50);
    expect(niceMax(120)).toBe(200);
    expect(niceMax(8)).toBe(10);
  });

  test('condição negativa: valor zero ou negativo cai no piso mínimo (10), não quebra o eixo', () => {
    expect(niceMax(0)).toBe(10);
    expect(niceMax(-5)).toBe(10);
  });
});

describe('roundedTopRectPath', () => {
  test('gera path não vazio pra dimensões válidas', () => {
    expect(roundedTopRectPath(0, 0, 20, 100, 4)).toContain('M0,4');
  });

  test('condição negativa: largura ou altura zero não gera path (barra invisível, sem erro de render)', () => {
    expect(roundedTopRectPath(0, 0, 0, 100, 4)).toBe('');
    expect(roundedTopRectPath(0, 0, 20, 0, 4)).toBe('');
  });
});

describe('roundedEndRectPath', () => {
  test('gera path não vazio pra dimensões válidas', () => {
    expect(roundedEndRectPath(0, 0, 100, 20, 4)).toContain('M0,0');
  });

  test('condição negativa: largura ou altura zero não gera path', () => {
    expect(roundedEndRectPath(0, 0, 0, 20, 4)).toBe('');
    expect(roundedEndRectPath(0, 0, 100, 0, 4)).toBe('');
  });
});
