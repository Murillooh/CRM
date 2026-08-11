"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateWorkspace(workspaceSlug: string, formData: FormData) {
  const { workspace, role } = await requireWorkspaceAccess(workspaceSlug);

  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas Administradores ou Donos podem alterar as configurações do Workspace.");
  }

  const name = formData.get("name") as string;
  let newSlug = formData.get("slug") as string;

  if (!name || !newSlug) {
    throw new Error("Nome e Slug são obrigatórios.");
  }

  // Format slug basic
  newSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  // Check if slug is taken by another workspace
  const existing = await db.workspace.findUnique({
    where: { slug: newSlug }
  });

  if (existing && existing.id !== workspace.id) {
    throw new Error("Este slug (URL) já está em uso por outro workspace.");
  }

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      name,
      slug: newSlug
    }
  });

  if (newSlug !== workspaceSlug) {
    redirect(`/workspaces/${newSlug}/settings`);
  } else {
    revalidatePath(`/workspaces/${workspaceSlug}/settings`);
  }
}
