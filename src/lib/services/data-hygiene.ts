import { extractDomain } from "./email-matching";

/**
 * Detecção de possíveis duplicados (Módulo 8 — higiene de dados). Função pura: mesmo nome
 * (case-insensitive) ou mesmo domínio de e-mail de outro contato já existente no workspace.
 */
export interface DuplicateCandidate {
  id: string;
  name: string;
  email: string | null;
}

export function findDuplicateContacts(
  newContact: { name: string; email: string | null },
  existing: DuplicateCandidate[]
): DuplicateCandidate[] {
  const normalizedName = newContact.name.trim().toLowerCase();
  const domain = newContact.email ? extractDomain(newContact.email) : null;

  return existing.filter((candidate) => {
    if (candidate.name.trim().toLowerCase() === normalizedName) return true;
    if (domain && candidate.email && extractDomain(candidate.email) === domain) return true;
    return false;
  });
}
