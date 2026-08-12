import { createAuthClient } from "better-auth/react"

// Sem NEXT_PUBLIC_APP_URL, deixa o better-auth inferir a origem atual
// (evita cair em localhost:3000 hardcoded quando rodando em produção).
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : undefined)
})
