import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Libera rotas publicas e rotas de API do Auth
  // /f/ e /api/webhooks/forms/ são o formulário hospedado que o cliente final
  // preenche sem conta no CRM — não pode exigir login.
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/setup-admin') ||
    pathname.startsWith('/f/') ||
    pathname.startsWith('/api/webhooks/forms/') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // 2. Tenta recuperar o cookie de sessão do Better-Auth
  // Em produção (HTTPS), o better-auth usa cookie seguro com prefixo __Secure- automaticamente;
  // em dev (HTTP) usa o nome puro. Precisa checar os dois.
  const sessionCookie =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Em aplicações Enterprise com Better-Auth, a validação fina do RBAC e Workspace 
  // acontece no Server Components (nosso auth.ts guard). 
  // O middleware serve apenas como barreira Edge inicial.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
