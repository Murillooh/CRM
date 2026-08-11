"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { AuthorizationError } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { GmailProvider } from "@/lib/services/email/gmail-provider";
import { decryptToken, deserializeEncrypted, encryptToken, serializeEncrypted, loadEncryptionKey } from "@/lib/services/token-crypto";
import { composeBody, buildRawEmail } from "@/lib/services/email-compose";

function getEncryptionKey() {
  const raw = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("EMAIL_TOKEN_ENCRYPTION_KEY não configurada no ambiente.");
  return loadEncryptionKey(raw);
}

export interface SendEmailInput {
  emailAccountId: string;
  to: string;
  subject: string;
  body: string;
  dealId?: string;
  contactId?: string;
  companyId?: string;
}

/**
 * Envia um e-mail direto da caixa Gmail conectada do usuário (não confundir com o Resend
 * usado na sequência de nutrição — ali o remetente é genérico, aqui é a caixa pessoal do
 * rep, então a resposta do lead cai no lugar certo). Já grava a Activity na hora; quando o
 * sync passar pela pasta Enviados, o dedup por externalId evita duplicar.
 */
export async function sendEmail(workspaceSlug: string, input: SendEmailInput) {
  const { user, workspace, role } = await requireWorkspaceAccess(workspaceSlug);
  if (role === "VIEWER") {
    throw new AuthorizationError("Viewers não podem enviar e-mail.");
  }

  if (!input.to || !input.subject || !input.body) {
    throw new Error("Para, Assunto e Mensagem são obrigatórios.");
  }

  const account = await db.emailAccount.findFirst({
    where: { id: input.emailAccountId, workspaceId: workspace.id, status: "CONNECTED" },
  });
  if (!account) {
    throw new Error("Conta de e-mail não encontrada ou desconectada. Reconecte em Configurações.");
  }

  const key = getEncryptionKey();
  const accessToken = decryptToken(deserializeEncrypted(account.accessTokenEnc), key);
  const refreshToken = decryptToken(deserializeEncrypted(account.refreshTokenEnc), key);

  let refreshedAccessToken: string | null = null;
  const provider = new GmailProvider({ accessToken, refreshToken }, (newAccessToken) => {
    refreshedAccessToken = newAccessToken;
  });

  const me = await db.user.findUnique({ where: { id: user.id }, select: { emailSignature: true } });
  const composedBody = composeBody(input.body, me?.emailSignature);
  const raw = buildRawEmail({ from: account.emailAddress, to: input.to, subject: input.subject, body: composedBody });

  const { providerMessageId } = await provider.sendRaw(raw);

  if (refreshedAccessToken) {
    await db.emailAccount.update({
      where: { id: account.id },
      data: { accessTokenEnc: serializeEncrypted(encryptToken(refreshedAccessToken, key)) },
    });
  }

  await db.activity.upsert({
    where: { workspaceId_externalId: { workspaceId: workspace.id, externalId: providerMessageId } },
    update: {},
    create: {
      workspaceId: workspace.id,
      type: "EMAIL",
      externalId: providerMessageId,
      performerId: user.id,
      description: `${input.subject} — enviado por você`,
      metadata: { to: [input.to], from: account.emailAddress },
      dealId: input.dealId,
      contactId: input.contactId,
      companyId: input.companyId,
    },
  });

  if (input.dealId) revalidatePath(`/workspaces/${workspaceSlug}/deals`);
  if (input.contactId) revalidatePath(`/workspaces/${workspaceSlug}/contacts`);

  return { providerMessageId };
}
