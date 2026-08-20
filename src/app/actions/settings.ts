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

export async function updateFormSlug(workspaceSlug: string, formData: FormData) {
  const { workspace, role } = await requireWorkspaceAccess(workspaceSlug);

  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas Administradores ou Donos podem alterar o link do formulário.");
  }

  const raw = (formData.get("formSlug") as string) || "";
  const trimmed = raw.trim();

  // Campo vazio = volta a usar o slug interno do workspace (comportamento padrão).
  if (!trimmed) {
    await db.workspace.update({
      where: { id: workspace.id },
      data: { formSlug: null },
    });
    revalidatePath(`/workspaces/${workspaceSlug}/settings`);
    return;
  }

  const newFormSlug = trimmed.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  if (newFormSlug.length < 3) {
    throw new Error("O nome do link precisa ter pelo menos 3 caracteres.");
  }

  // Precisa ser único tanto entre form slugs quanto contra slugs internos de outros
  // workspaces, já que a rota /f/[slug] busca nos dois campos.
  const [existingFormSlug, existingSlug] = await Promise.all([
    db.workspace.findUnique({ where: { formSlug: newFormSlug } }),
    db.workspace.findUnique({ where: { slug: newFormSlug } }),
  ]);

  if ((existingFormSlug && existingFormSlug.id !== workspace.id) || (existingSlug && existingSlug.id !== workspace.id)) {
    throw new Error("Este nome de link já está em uso. Escolha outro.");
  }

  await db.workspace.update({
    where: { id: workspace.id },
    data: { formSlug: newFormSlug },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
}

export async function removeMember(workspaceSlug: string, userIdToRemove: string) {
  const { workspace, role, user: currentUser } = await requireWorkspaceAccess(workspaceSlug);

  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas Administradores ou Donos podem gerenciar membros.");
  }

  const targetMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: userIdToRemove,
        workspaceId: workspace.id,
      }
    }
  });

  if (!targetMembership) {
    throw new Error("Membro não encontrado.");
  }

  if (targetMembership.role === "OWNER") {
    throw new Error("Não é possível remover o Dono do workspace.");
  }

  if (userIdToRemove === currentUser.id) {
    throw new Error("Você não pode remover a si mesmo desta forma.");
  }

  await db.membership.delete({
    where: {
      id: targetMembership.id
    }
  });

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
}
