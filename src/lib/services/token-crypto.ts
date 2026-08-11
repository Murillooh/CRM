import crypto from "node:crypto";

/**
 * Criptografia AES-256-GCM pros tokens OAuth do Email Sync (Módulo 5). Nunca guardamos
 * access/refresh token em texto puro no banco. Chave vem de fora (EMAIL_TOKEN_ENCRYPTION_KEY),
 * essas funções não leem env — recebem a chave como parâmetro, o que as deixa puras e testáveis.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32; // AES-256
const IV_LENGTH_BYTES = 12; // Recomendado pro GCM

export interface EncryptedPayload {
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}

export function encryptToken(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptToken(payload: EncryptedPayload, key: Buffer): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Serializa o payload numa única string (cabe em uma coluna Text). */
export function serializeEncrypted(payload: EncryptedPayload): string {
  return `${payload.iv}.${payload.authTag}.${payload.ciphertext}`;
}

export function deserializeEncrypted(serialized: string): EncryptedPayload {
  const parts = serialized.split(".");
  if (parts.length !== 3 || parts.some((p) => !p)) {
    throw new Error("Formato de token criptografado inválido.");
  }
  const [iv, authTag, ciphertext] = parts;
  return { iv, authTag, ciphertext };
}

/** Decodifica a env var (base64) pra um Buffer de 32 bytes válido pra AES-256. */
export function loadEncryptionKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `EMAIL_TOKEN_ENCRYPTION_KEY precisa decodificar pra ${KEY_LENGTH_BYTES} bytes (AES-256). Gere com: openssl rand -base64 32`
    );
  }
  return key;
}
