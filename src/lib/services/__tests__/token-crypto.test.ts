import { expect, test, describe } from 'vitest';
import crypto from 'node:crypto';
import { encryptToken, decryptToken, serializeEncrypted, deserializeEncrypted, loadEncryptionKey } from '../token-crypto';

const KEY = crypto.randomBytes(32);
const OTHER_KEY = crypto.randomBytes(32);

describe('encryptToken / decryptToken', () => {
  test('roundtrip: decripta exatamente o que foi criptografado', () => {
    const payload = encryptToken('ya29.super-secret-refresh-token', KEY);
    expect(decryptToken(payload, KEY)).toBe('ya29.super-secret-refresh-token');
  });

  test('condição negativa: chave errada não decripta (auth tag falha)', () => {
    const payload = encryptToken('token-secreto', KEY);
    expect(() => decryptToken(payload, OTHER_KEY)).toThrow();
  });

  test('condição negativa: ciphertext adulterado não decripta', () => {
    const payload = encryptToken('token-secreto', KEY);
    const tampered = { ...payload, ciphertext: encryptToken('outro-valor', KEY).ciphertext };
    expect(() => decryptToken(tampered, KEY)).toThrow();
  });
});

describe('serializeEncrypted / deserializeEncrypted', () => {
  test('roundtrip preserva os 3 campos', () => {
    const payload = encryptToken('token', KEY);
    const roundtripped = deserializeEncrypted(serializeEncrypted(payload));
    expect(roundtripped).toEqual(payload);
    expect(decryptToken(roundtripped, KEY)).toBe('token');
  });

  test('condição negativa: string malformada lança erro em vez de falhar silenciosamente', () => {
    expect(() => deserializeEncrypted('nao-e-um-payload-valido')).toThrow();
  });
});

describe('loadEncryptionKey', () => {
  test('decodifica base64 de 32 bytes corretamente', () => {
    const key = crypto.randomBytes(32).toString('base64');
    expect(loadEncryptionKey(key).length).toBe(32);
  });

  test('condição negativa: chave de tamanho errado lança erro (evita AES silenciosamente fraco)', () => {
    const shortKey = crypto.randomBytes(16).toString('base64');
    expect(() => loadEncryptionKey(shortKey)).toThrow();
  });
});
