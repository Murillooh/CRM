import { expect, test, describe } from 'vitest';
import { isEnrollmentDue, shouldStopEnrollment, getNextStep, computeNextSendAt } from '../email-nurture';

const NOW = new Date('2026-08-11T12:00:00Z');

describe('isEnrollmentDue', () => {
  test('ativo e vencido está due', () => {
    expect(isEnrollmentDue({ status: 'ACTIVE', nextSendAt: new Date('2026-08-11T11:00:00Z') }, NOW)).toBe(true);
  });

  test('condição negativa: ativo mas ainda não venceu', () => {
    expect(isEnrollmentDue({ status: 'ACTIVE', nextSendAt: new Date('2026-08-11T13:00:00Z') }, NOW)).toBe(false);
  });

  test('condição negativa: vencido mas já parado/completo não é due', () => {
    expect(isEnrollmentDue({ status: 'STOPPED', nextSendAt: new Date('2026-08-11T11:00:00Z') }, NOW)).toBe(false);
    expect(isEnrollmentDue({ status: 'COMPLETED', nextSendAt: new Date('2026-08-11T11:00:00Z') }, NOW)).toBe(false);
  });
});

describe('shouldStopEnrollment', () => {
  test('para quando o deal saiu do estágio em que foi enrolled', () => {
    expect(shouldStopEnrollment('stage-1', 'stage-2')).toBe(true);
  });

  test('condição negativa: continua enquanto o deal segue no mesmo estágio', () => {
    expect(shouldStopEnrollment('stage-1', 'stage-1')).toBe(false);
  });

  test('para se o deal não tem mais estágio (edge case)', () => {
    expect(shouldStopEnrollment('stage-1', null)).toBe(true);
  });
});

describe('getNextStep', () => {
  const steps = [
    { subject: 'Oi', body: 'Primeiro contato', delayDays: 2 },
    { subject: 'Novidades', body: 'Segundo contato', delayDays: 5 },
  ];

  test('retorna o step correspondente', () => {
    expect(getNextStep(steps, 0)).toEqual(steps[0]);
    expect(getNextStep(steps, 1)).toEqual(steps[1]);
  });

  test('condição negativa: sequência esgotada retorna null', () => {
    expect(getNextStep(steps, 2)).toBeNull();
  });
});

describe('computeNextSendAt', () => {
  test('soma os dias de atraso', () => {
    expect(computeNextSendAt(NOW, 3).toISOString()).toBe('2026-08-14T12:00:00.000Z');
  });
});
