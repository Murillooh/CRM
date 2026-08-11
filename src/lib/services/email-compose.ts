/**
 * Composição e montagem do e-mail (Email Sync, Módulo 5). Funções puras — sem I/O,
 * sem chamada ao Gmail. O provider (gmail-provider.ts) só manda o `raw` já pronto.
 */

export function composeBody(bodyText: string, signature: string | null | undefined): string {
  if (!signature || !signature.trim()) return bodyText;
  return `${bodyText}\n\n--\n${signature}`;
}

export interface RawEmailInput {
  from: string;
  to: string;
  subject: string;
  body: string; // já com assinatura, se houver (ver composeBody)
}

/**
 * Monta um RFC822 simples (texto puro) e retorna em base64url — formato exigido por
 * `users.messages.send` do Gmail (`requestBody.raw`).
 */
export function buildRawEmail(input: RawEmailInput): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeSubject(input.subject)}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `MIME-Version: 1.0`,
  ].join("\r\n");

  const message = `${headers}\r\n\r\n${input.body}`;
  return base64UrlEncode(message);
}

/** Assunto com acento/emoji precisa de encoded-word (RFC 2047) pra sobreviver ao transporte. */
function encodeSubject(subject: string): string {
  const hasNonAscii = /[^\x00-\x7F]/.test(subject);
  if (!hasNonAscii) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
