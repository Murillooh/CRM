/**
 * Casamento de endereço de e-mail com Contact/Company do workspace (Email Sync, Módulo 5).
 * Função pura — a lista de contatos/empresas conhecidos é injetada, sem I/O aqui.
 */

export interface KnownContact {
  id: string;
  email: string | null;
}

export interface KnownCompany {
  id: string;
  domain: string | null;
}

export type EmailMatch = { type: "Contact"; id: string } | { type: "Company"; id: string } | null;

export function extractDomain(address: string): string | null {
  const at = address.lastIndexOf("@");
  if (at === -1 || at === address.length - 1) return null;
  return address.slice(at + 1).trim().toLowerCase();
}

/** Contact por e-mail exato tem prioridade; Company por domínio é o fallback. */
export function matchAddress(address: string, contacts: KnownContact[], companies: KnownCompany[]): EmailMatch {
  const normalized = address.trim().toLowerCase();
  if (!normalized) return null;

  const contact = contacts.find((c) => c.email && c.email.trim().toLowerCase() === normalized);
  if (contact) return { type: "Contact", id: contact.id };

  const domain = extractDomain(normalized);
  if (domain) {
    const company = companies.find((c) => c.domain && c.domain.trim().toLowerCase() === domain);
    if (company) return { type: "Company", id: company.id };
  }

  return null;
}

/** Primeiro match entre uma lista de endereços (From + To + Cc de uma mensagem). */
export function findRelevantMatch(addresses: string[], contacts: KnownContact[], companies: KnownCompany[]): EmailMatch {
  for (const address of addresses) {
    const match = matchAddress(address, contacts, companies);
    if (match) return match;
  }
  return null;
}
