import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import type { EmailProvider, EmailMessageSummary } from "./types";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados no ambiente.");
  }
  return { clientId, clientSecret };
}

export interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
}

/** Adapter Gmail (googleapis). Ver EmailProvider pra o contrato genérico. */
export class GmailProvider implements EmailProvider {
  private auth: InstanceType<typeof google.auth.OAuth2>;
  private gmail: gmail_v1.Gmail;

  constructor(credentials: GmailCredentials, private onTokenRefresh?: (accessToken: string) => void) {
    const { clientId, clientSecret } = getOAuthCredentials();

    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    // googleapis renova o access_token sozinho quando expira; persistimos o novo aqui.
    this.auth.on("tokens", (tokens) => {
      if (tokens.access_token) this.onTokenRefresh?.(tokens.access_token);
    });

    this.gmail = google.gmail({ version: "v1", auth: this.auth });
  }

  /** URL de consentimento OAuth. `access_type: offline` + `prompt: consent` garantem refresh_token. */
  static getAuthUrl(redirectUri: string, state: string): string {
    const { clientId, clientSecret } = getOAuthCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    return auth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state,
    });
  }

  /** Troca o `code` do callback OAuth pelos tokens + descobre o e-mail da conta conectada. */
  static async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; email: string }> {
    const { clientId, clientSecret } = getOAuthCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await auth.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error(
        "Google não retornou refresh_token. Revogue o acesso do app em myaccount.google.com/permissions e conecte de novo."
      );
    }

    auth.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) throw new Error("Não foi possível obter o e-mail da conta Google.");

    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, email: data.email };
  }

  async fetchHistory(historyId: string | null): Promise<{ messages: EmailMessageSummary[]; newHistoryId: string }> {
    if (!historyId) {
      // Primeiro sync: sem cursor ainda. Pega só as últimas 50 (não a caixa inteira) e
      // estabelece o historyId a partir dali pro sync incremental seguinte.
      const [profile, list] = await Promise.all([
        this.gmail.users.getProfile({ userId: "me" }),
        this.gmail.users.messages.list({ userId: "me", maxResults: 50 }),
      ]);
      const messages = await this.hydrateMessages((list.data.messages ?? []).map((m) => m.id!).filter(Boolean));
      return { messages, newHistoryId: String(profile.data.historyId) };
    }

    const history = await this.gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
    });

    const addedIds = new Set<string>();
    for (const record of history.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) addedIds.add(added.message.id);
      }
    }

    const messages = await this.hydrateMessages([...addedIds]);
    // Gmail expira o historyId após ~7 dias de inatividade — se sumir da resposta, mantém o antigo
    // (próxima falha real de sync vai cair no catch do engine e reagendar com backoff).
    const newHistoryId = String(history.data.historyId ?? historyId);
    return { messages, newHistoryId };
  }

  /** Só busca headers (format: metadata) — corpo completo não é necessário pro dedup/timeline, poupa cota. */
  private async hydrateMessages(ids: string[]): Promise<EmailMessageSummary[]> {
    const results: EmailMessageSummary[] = [];
    for (const id of ids) {
      const { data } = await this.gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Cc", "Subject"],
      });

      const headers = Object.fromEntries((data.payload?.headers ?? []).map((h) => [h.name?.toLowerCase() ?? "", h.value ?? ""]));
      const splitAddresses = (value: string) => value.split(",").map((s) => s.trim()).filter(Boolean);

      results.push({
        providerMessageId: data.id!,
        from: headers["from"] ?? "",
        to: splitAddresses(headers["to"] ?? ""),
        cc: splitAddresses(headers["cc"] ?? ""),
        subject: headers["subject"] ?? null,
        snippet: data.snippet ?? null,
        internalDate: data.internalDate ? new Date(Number(data.internalDate)) : new Date(),
      });
    }
    return results;
  }

  async sendRaw(rawBase64Url: string): Promise<{ providerMessageId: string }> {
    const { data } = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawBase64Url },
    });
    return { providerMessageId: data.id! };
  }
}
