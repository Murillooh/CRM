import { expect, test, describe } from 'vitest';
import { needsDiscountApproval } from '../deal-approval';

describe('needsDiscountApproval', () => {
  test('exige aprovação quando o desconto atinge o limiar', () => {
    expect(needsDiscountApproval(30, 20, 'NONE')).toBe(true);
  });

  test('exige aprovação exatamente no limiar (gte)', () => {
    expect(needsDiscountApproval(20, 20, 'NONE')).toBe(true);
  });

  test('condição negativa: desconto abaixo do limiar não exige aprovação', () => {
    expect(needsDiscountApproval(10, 20, 'NONE')).toBe(false);
  });

  test('condição negativa: já aprovado não exige de novo, mesmo com desconto alto', () => {
    expect(needsDiscountApproval(50, 20, 'APPROVED')).toBe(false);
  });

  test('rejeitado anteriormente volta a exigir aprovação (não trava permanente)', () => {
    expect(needsDiscountApproval(30, 20, 'REJECTED')).toBe(true);
  });
});
