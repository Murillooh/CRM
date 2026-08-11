import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Libera rotas publicas e rotas de API do Auth
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/public') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/setup-admin') || pathname === '/') {
    return NextResponse.next();
  }

  // 2. Tenta recuperar o cookie de sessão do Better-Auth
  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

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
