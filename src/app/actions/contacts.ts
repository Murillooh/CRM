"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function createContact(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const jobTitle = formData.get("jobTitle") as string;

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  await db.contact.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
      workspaceId: workspace.id,
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
