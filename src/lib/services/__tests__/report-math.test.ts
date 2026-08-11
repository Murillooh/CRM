import { expect, test, describe } from 'vitest';
import { computeDropOffRate, computeWinRate } from '../report-math';

describe('computeDropOffRate', () => {
  test('calcula a queda percentual entre estágios', () => {
    expect(computeDropOffRate(100, 60)).toBeCloseTo(0.4);
  });

  test('sem queda (mesma contagem) -> 0', () => {
    expect(computeDropOffRate(50, 50)).toBe(0);
  });

  test('condição negativa: estágio anterior vazio não divide por zero, retorna 0', () => {
    expect(computeDropOffRate(0, 0)).toBe(0);
  });

  test('condição negativa: próximo estágio maior que o anterior não vira queda negativa', () => {
    expect(computeDropOffRate(10, 15)).toBe(0);
  });
});

describe('computeWinRate', () => {
  test('calcula a proporção de ganhos', () => {
    expect(computeWinRate(3, 1)).toBe(0.75);
  });

  test('só ganhos -> 1', () => {
    expect(computeWinRate(5, 0)).toBe(1);
  });

  test('condição negativa: nenhum negócio fechado ainda -> 0, não NaN', () => {
    expect(computeWinRate(0, 0)).toBe(0);
  });

  test('condição negativa: só perdidos -> 0', () => {
    expect(computeWinRate(0, 4)).toBe(0);
  });
});
