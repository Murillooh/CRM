import { expect, test, describe } from 'vitest';
import { evaluateCondition } from '../workflow-conditions';

describe('evaluateCondition', () => {
  test('sem condition, sempre passa (workflow incondicional)', () => {
    expect(evaluateCondition(null, {})).toBe(true);
    expect(evaluateCondition({}, {})).toBe(true);
  });

  describe('operator: equals', () => {
    test('passa quando o valor bate', () => {
      expect(evaluateCondition({ field: 'toStage', operator: 'equals', value: 'won' }, { toStage: 'won' })).toBe(true);
    });

    test('condição negativa: não passa quando o valor diverge', () => {
      expect(evaluateCondition({ field: 'toStage', operator: 'equals', value: 'won' }, { toStage: 'lost' })).toBe(false);
    });
  });

  describe('operator: isNull', () => {
    test('passa quando o campo é null ou undefined (ex: lead sem responsável)', () => {
      expect(evaluateCondition({ field: 'ownerId', operator: 'isNull' }, { ownerId: null })).toBe(true);
      expect(evaluateCondition({ field: 'ownerId', operator: 'isNull' }, {})).toBe(true);
    });

    test('condição negativa: não passa quando o campo já tem valor', () => {
      expect(evaluateCondition({ field: 'ownerId', operator: 'isNull' }, { ownerId: 'user-1' })).toBe(false);
    });
  });

  describe('operator: notEquals', () => {
    test('passa quando o valor diverge', () => {
      expect(evaluateCondition({ field: 'status', operator: 'notEquals', value: 'APPROVED' }, { status: 'PENDING' })).toBe(true);
    });

    test('condição negativa: não passa quando o valor bate', () => {
      expect(evaluateCondition({ field: 'status', operator: 'notEquals', value: 'APPROVED' }, { status: 'APPROVED' })).toBe(false);
    });
  });

  describe('operator: gte (ex: deal parado há N dias)', () => {
    test('passa quando o valor é maior ou igual', () => {
      expect(evaluateCondition({ field: 'daysInStage', operator: 'gte', value: 5 }, { daysInStage: 5 })).toBe(true);
      expect(evaluateCondition({ field: 'daysInStage', operator: 'gte', value: 5 }, { daysInStage: 8 })).toBe(true);
    });

    test('condição negativa: não passa quando o valor é menor', () => {
      expect(evaluateCondition({ field: 'daysInStage', operator: 'gte', value: 5 }, { daysInStage: 2 })).toBe(false);
    });
  });

  describe('operator: lte', () => {
    test('passa quando o valor é menor ou igual', () => {
      expect(evaluateCondition({ field: 'discountPercent', operator: 'lte', value: 20 }, { discountPercent: 20 })).toBe(true);
    });

    test('condição negativa: não passa quando o valor é maior', () => {
      expect(evaluateCondition({ field: 'discountPercent', operator: 'lte', value: 20 }, { discountPercent: 35 })).toBe(false);
    });
  });

  describe('operator: anyNull (ex: cadastro incompleto)', () => {
    test('passa quando pelo menos um dos campos listados é null/undefined', () => {
      expect(evaluateCondition({ operator: 'anyNull', value: ['email', 'phone'] }, { email: null, phone: '11999999999' })).toBe(true);
      expect(evaluateCondition({ operator: 'anyNull', value: ['email', 'phone'] }, { email: 'a@b.com' })).toBe(true); // phone ausente
    });

    test('condição negativa: não passa quando todos os campos listados têm valor', () => {
      expect(evaluateCondition({ operator: 'anyNull', value: ['email', 'phone'] }, { email: 'a@b.com', phone: '11999999999' })).toBe(false);
    });

    test('condição negativa: value malformado (não é array) não bloqueia', () => {
      expect(evaluateCondition({ operator: 'anyNull', value: 'email' }, { email: null })).toBe(true);
    });
  });
});
