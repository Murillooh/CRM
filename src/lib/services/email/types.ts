/**
 * Abstração de provedor de e-mail (Módulo 5 — Email Sync). Gmail é o primeiro adapter;
 * Outlook/Microsoft Graph pluga na mesma interface depois sem redesenhar o sync engine.
 */
export interface EmailMessageSummary {
  providerMessageId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string | null;
  snippet: string | null;
  internalDate: Date;
}

export interface EmailProvider {
  /**
   * Sync incremental: sem `historyId` (primeira vez), pega só as últimas mensagens e
   * estabelece o cursor; com `historyId`, pega só o delta desde ali (evita re-escanear a caixa).
   */
  fetchHistory(historyId: string | null): Promise<{ messages: EmailMessageSummary[]; newHistoryId: string }>;
  sendRaw(rawBase64Url: string): Promise<{ providerMessageId: string }>;
}
