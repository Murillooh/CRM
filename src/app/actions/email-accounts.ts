"use server";

import { db } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function disconnectEmailAccount(workspaceSlug: string, emailAccountId: string) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  await db.emailAccount.updateMany({
    where: { id: emailAccountId, workspaceId: workspace.id },
    data: { status: "DISCONNECTED" },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
}

export async function updateEmailSignature(workspaceSlug: string, formData: FormData) {
  const { user } = await requireWorkspaceAccess(workspaceSlug);

  const signature = (formData.get("emailSignature") as string) || null;

  await db.user.update({
    where: { id: user.id },
    data: { emailSignature: signature },
  });

  revalidatePath(`/workspaces/${workspaceSlug}/settings`);
}
