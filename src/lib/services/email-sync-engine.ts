import { db } from "@/lib/db";
import { GmailProvider } from "./email/gmail-provider";
import { decryptToken, deserializeEncrypted, encryptToken, serializeEncrypted, loadEncryptionKey } from "./token-crypto";
import { findRelevantMatch } from "./email-matching";
import { selectAccountsDueForSync, computeNextSyncAt, computeBackoffUntil } from "./email-sync-scheduler";

const SYNC_INTERVAL_MINUTES = 10;
const MAX_ACCOUNTS_PER_TICK = 20;

function getEncryptionKey(): Buffer {
  const raw = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("EMAIL_TOKEN_ENCRYPTION_KEY não configurada no ambiente.");
  return loadEncryptionKey(raw);
}

/**
 * Chamado pelo scanner de cron (/api/cron/email-sync). Processa só as EmailAccount
 * vencidas (nextSyncAt) e sem backoff ativo, respeitando o cap por tick.
 */
export async function runEmailSyncTick(now: Date = new Date()) {
  const key = getEncryptionKey();

  const candidates = await db.emailAccount.findMany({
    where: { status: { in: ["CONNECTED", "ERROR"] } },
  });

  const due = selectAccountsDueForSync(
    candidates.map((a) => ({ id: a.id, nextSyncAt: a.nextSyncAt, backoffUntil: a.backoffUntil, status: a.status })),
    now,
    MAX_ACCOUNTS_PER_TICK
  );

  let synced = 0;
  for (const { id } of due) {
    const account = candidates.find((a) => a.id === id)!;
    try {
      await syncAccount(account, key, now);
      synced++;
    } catch (error: any) {
      console.error(`[EmailSync] Falha ao sincronizar conta ${account.id}:`, error);
      await handleSyncError(account.id, account.backoffAttempts, error, now);
    }
  }

  return { scanned: candidates.length, due: due.length, synced };
}

async function syncAccount(account: any, key: Buffer, now: Date) {
  const accessToken = decryptToken(deserializeEncrypted(account.accessTokenEnc), key);
  const refreshToken = decryptToken(deserializeEncrypted(account.refreshTokenEnc), key);

  let refreshedAccessToken: string | null = null;
  const provider = new GmailProvider({ accessToken, refreshToken }, (newAccessToken) => {
    refreshedAccessToken = newAccessToken;
  });

  const { messages, newHistoryId } = await provider.fetchHistory(account.historyId);

  const [contacts, companies] = await Promise.all([
    db.contact.findMany({ where: { workspaceId: account.workspaceId, deletedAt: null }, select: { id: true, email: true } }),
    db.company.findMany({ where: { workspaceId: account.workspaceId, deletedAt: null }, select: { id: true, domain: true } }),
  ]);

  for (const message of messages) {
    const addresses = [message.from, ...message.to, ...message.cc];
    const match = findRelevantMatch(addresses, contacts, companies);
    if (!match) continue; // Não relevante pro workspace — não vira ruído na timeline

    // Dedup via unique(workspaceId, externalId): upsert idempotente, seguro re-rodar sobre a mesma mensagem.
    await db.activity.upsert({
      where: { workspaceId_externalId: { workspaceId: account.workspaceId, externalId: message.providerMessageId } },
      update: {},
      create: {
        workspaceId: account.workspaceId,
        type: "EMAIL",
        externalId: message.providerMessageId,
        description: [message.subject, message.snippet].filter(Boolean).join(" — ") || null,
        metadata: { from: message.from, to: message.to, cc: message.cc },
        createdAt: message.internalDate,
        ...(match.type === "Contact" ? { contactId: match.id } : { companyId: match.id }),
      },
    });
  }

  await db.emailAccount.update({
    where: { id: account.id },
    data: {
      historyId: newHistoryId,
      lastSyncAt: now,
      nextSyncAt: computeNextSyncAt(now, SYNC_INTERVAL_MINUTES),
      status: "CONNECTED",
      lastError: null,
      backoffUntil: null,
      backoffAttempts: 0,
      ...(refreshedAccessToken ? { accessTokenEnc: serializeEncrypted(encryptToken(refreshedAccessToken, key)) } : {}),
    },
  });
}

async function handleSyncError(accountId: string, previousAttempts: number, error: any, now: Date) {
  const attempt = previousAttempts + 1;
  await db.emailAccount.update({
    where: { id: accountId },
    data: {
      status: "ERROR",
      lastError: String(error?.message ?? error),
      backoffAttempts: attempt,
      backoffUntil: computeBackoffUntil(now, attempt),
    },
  });
}
