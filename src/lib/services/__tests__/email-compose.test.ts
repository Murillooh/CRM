import { expect, test, describe } from 'vitest';
import { composeBody, buildRawEmail } from '../email-compose';

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

describe('composeBody', () => {
  test('anexa a assinatura com separador', () => {
    expect(composeBody('Olá, tudo bem?', 'Maria Vendas')).toBe('Olá, tudo bem?\n\n--\nMaria Vendas');
  });

  test('condição negativa: sem assinatura, corpo fica intacto', () => {
    expect(composeBody('Olá, tudo bem?', null)).toBe('Olá, tudo bem?');
    expect(composeBody('Olá, tudo bem?', '   ')).toBe('Olá, tudo bem?');
  });
});

describe('buildRawEmail', () => {
  test('monta headers e corpo, e o resultado é base64url válido (sem +, / ou =)', () => {
    const raw = buildRawEmail({ from: 'rep@empresa.com', to: 'lead@acme.com', subject: 'Proposta', body: 'Segue em anexo.' });

    expect(raw).not.toMatch(/[+/=]/);

    const decoded = decodeBase64Url(raw);
    expect(decoded).toContain('From: rep@empresa.com');
    expect(decoded).toContain('To: lead@acme.com');
    expect(decoded).toContain('Subject: Proposta');
    expect(decoded).toContain('Segue em anexo.');
  });

  test('condição negativa: assunto com acento não fica em texto puro, vira encoded-word RFC 2047', () => {
    const raw = buildRawEmail({ from: 'a@x.com', to: 'b@y.com', subject: 'Proposta não vencida', body: 'oi' });
    const decoded = decodeBase64Url(raw);

    expect(decoded).not.toContain('Subject: Proposta não vencida');
    expect(decoded).toMatch(/Subject: =\?UTF-8\?B\?/);
  });
});
