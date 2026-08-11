import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { GmailProvider } from "@/lib/services/email/gmail-provider";
import { encryptToken, serializeEncrypted, loadEncryptionKey } from "@/lib/services/token-crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settingsUrl = (query: string) => new URL(`/workspaces/${slug}/settings${query}`, req.url);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("gmail_oauth_state")?.value;

  // CSRF: o state devolvido pelo Google tem que bater exatamente com o que setamos no /connect.
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(settingsUrl("?email_error=invalid_state"));
  }

  const { user, workspace } = await requireWorkspaceAccess(slug);

  const encKeyRaw = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!encKeyRaw) {
    return NextResponse.redirect(settingsUrl("?email_error=not_configured"));
  }

  try {
    const redirectUri = new URL(`/api/v1/workspaces/${slug}/email-accounts/callback`, req.url).toString();
    const { accessToken, refreshToken, email } = await GmailProvider.exchangeCode(code, redirectUri);
    const key = loadEncryptionKey(encKeyRaw);

    await db.emailAccount.upsert({
      where: { workspaceId_emailAddress: { workspaceId: workspace.id, emailAddress: email } },
      update: {
        accessTokenEnc: serializeEncrypted(encryptToken(accessToken, key)),
        refreshTokenEnc: serializeEncrypted(encryptToken(refreshToken, key)),
        status: "CONNECTED",
        lastError: null,
        backoffUntil: null,
        backoffAttempts: 0,
        nextSyncAt: new Date(),
      },
      create: {
        workspaceId: workspace.id,
        connectedById: user.id,
        emailAddress: email,
        accessTokenEnc: serializeEncrypted(encryptToken(accessToken, key)),
        refreshTokenEnc: serializeEncrypted(encryptToken(refreshToken, key)),
        nextSyncAt: new Date(),
      },
    });

    const response = NextResponse.redirect(settingsUrl("?email_connected=1"));
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (error: any) {
    console.error("[EmailAccounts] OAuth callback falhou:", error);
    return NextResponse.redirect(settingsUrl(`?email_error=${encodeURIComponent(error?.message ?? "unknown")}`));
  }
}
