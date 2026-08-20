import { createAuthClient } from "better-auth/react"

// A API de auth é sempre same-origin com a página (não existe domínio de API
// separado nesse app), então no navegador SEMPRE usa window.location.origin —
// nunca NEXT_PUBLIC_APP_URL. Esse projeto responde em vários domínios/aliases
// da Vercel ao mesmo tempo (crm-murillo97.vercel.app, crm-six-woad-38.vercel.app,
// etc.); se NEXT_PUBLIC_APP_URL tivesse prioridade e apontasse pra um deles,
// abrir o app por qualquer outro viraria uma chamada cross-origin de verdade —
// sem CORS liberado nessa rota, o preflight falha e o login trava com
// "Não foi possível conectar ao servidor", sem POST nenhum chegando no servidor.
// NEXT_PUBLIC_APP_URL só serve de fallback fora do navegador (build/SSR).
export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL
})
