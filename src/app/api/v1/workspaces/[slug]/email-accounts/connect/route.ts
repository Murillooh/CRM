import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { GmailProvider } from "@/lib/services/email/gmail-provider";

/**
 * Inicia o OAuth do Gmail pra essa EmailAccount. Redireciona pro consentimento do Google;
 * o `state` (com nonce) volta no callback e é conferido contra um cookie httpOnly (CSRF).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const { role } = await requireWorkspaceAccess(slug);
    if (role === "VIEWER") {
      return NextResponse.redirect(new URL(`/workspaces/${slug}/settings?email_error=forbidden`, req.url));
    }

    const redirectUri = new URL(`/api/v1/workspaces/${slug}/email-accounts/callback`, req.url).toString();
    const nonce = randomBytes(16).toString("hex");
    const state = `${slug}:${nonce}`;

    const authUrl = GmailProvider.getAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("[EmailAccounts] Falha ao iniciar OAuth:", error);
    return NextResponse.redirect(new URL(`/workspaces/${slug}/settings?email_error=${encodeURIComponent(error?.message ?? "unknown")}`, req.url));
  }
}
