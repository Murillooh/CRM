import { expect, test, describe } from 'vitest';
import { interpolateTemplate } from '../workflow-template';

describe('interpolateTemplate', () => {
  test('substitui placeholders pelos valores do contexto', () => {
    expect(interpolateTemplate('Completar cadastro de {{name}}', { name: 'João Silva' })).toBe('Completar cadastro de João Silva');
  });

  test('substitui múltiplos placeholders', () => {
    expect(interpolateTemplate('{{name}} ({{email}})', { name: 'João', email: 'joao@x.com' })).toBe('João (joao@x.com)');
  });

  test('condição negativa: placeholder sem valor correspondente vira string vazia, sem quebrar', () => {
    expect(interpolateTemplate('Olá {{name}}', {})).toBe('Olá ');
  });

  test('condição negativa: template sem placeholder fica intacto', () => {
    expect(interpolateTemplate('Tarefa genérica', { name: 'João' })).toBe('Tarefa genérica');
  });
});
