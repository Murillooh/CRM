"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { WorkflowEngine } from "@/lib/services/workflow-engine";
import { findDuplicateContacts } from "@/lib/services/data-hygiene";

export async function createContact(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const jobTitle = formData.get("jobTitle") as string;

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  // Precisa rodar antes do create, senão o próprio contato novo entraria na lista e "bateria com ele mesmo".
  const existingContacts = await db.contact.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  const contact = await db.contact.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
      workspaceId: workspace.id,
    },
    include: { company: true },
  });

  const duplicates = findDuplicateContacts({ name: contact.name, email: contact.email }, existingContacts);

  // Dispara o motor de automação (Módulo 8) — roteamento de leads e higiene de dados.
  await WorkflowEngine.evaluateEvent({
    workspaceId: workspace.id,
    triggerType: "CONTACT_CREATED",
    entityType: "Contact",
    entityId: contact.id,
    data: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      ownerId: contact.ownerId,
      region: contact.company?.region ?? null,
      employeeCount: contact.company?.employeeCount ?? null,
      hasDuplicate: duplicates.length > 0,
      duplicateIds: duplicates.map((d) => d.id),
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
}

export async function updateContact(workspaceSlug: string, contactId: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const jobTitle = formData.get("jobTitle") as string;

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  await db.contact.updateMany({
    where: {
      id: contactId,
      workspaceId: workspace.id,
    },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
    },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
}

export async function deleteContact(workspaceSlug: string, contactId: string) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  // Soft delete ou delete direto. No schema tem deletedAt, então vamos usar hard delete para simplificar
  // ou soft delete se preferir. O schema permite soft delete `deletedAt: DateTime?`
  await db.contact.updateMany({
    where: {
      id: contactId,
      workspaceId: workspace.id
    },
    data: {
      deletedAt: new Date()
    }
  });

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
}

/** Exclusão em massa (soft delete) — item 2 da auditoria de UX: ações em lote na tabela de Contatos. */
export async function bulkDeleteContacts(workspaceSlug: string, contactIds: string[]) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);
  if (contactIds.length === 0) return;

  await db.contact.updateMany({
    where: { id: { in: contactIds }, workspaceId: workspace.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
}

/** Atribuição em massa de responsável — mesmo item da auditoria. `ownerId: null` limpa o responsável. */
export async function bulkAssignContacts(workspaceSlug: string, contactIds: string[], ownerId: string | null) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);
  if (contactIds.length === 0) return;

  await db.contact.updateMany({
    where: { id: { in: contactIds }, workspaceId: workspace.id },
    data: { ownerId },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/contacts`);
}
