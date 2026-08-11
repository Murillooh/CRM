import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/auth/permissions";

/**
 * Padrão de Sucesso da API
 */
export function apiResponse(data: any, status = 200, meta?: any) {
  return NextResponse.json(
    {
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

/**
 * Padrão de Erro da API e Tratamento Automático de Exceções
 */
export function apiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados de entrada inválidos",
          issues: (error as any).errors.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      },
      { status: 403 }
    );
  }

  if (error instanceof Error && error.message.includes("Access denied")) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro interno no servidor.",
      },
    },
    { status: 500 }
  );
}

/**
 * Simulação de Rate Limiting (Sliding Window / Memory)
 * Em um cenário real, deve-se usar Redis / Vercel KV
 */
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(identifier: string, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimits.get(identifier);

  if (!record || record.expiresAt < now) {
    rateLimits.set(identifier, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Rate limit excedido
  }

  record.count += 1;
  return true;
}
