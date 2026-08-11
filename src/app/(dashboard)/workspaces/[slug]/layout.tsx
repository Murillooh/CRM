import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceSlug={resolvedParams.slug} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar workspaceSlug={resolvedParams.slug} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
