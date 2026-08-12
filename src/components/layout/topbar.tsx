import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { NotificationsNav, type ActivityItem } from "./notifications-nav";
import { TopbarSearch } from "./topbar-search";
import { requireWorkspaceAccess } from "@/lib/auth/guard";
import { db } from "@/lib/db";

export async function Topbar({ workspaceSlug }: { workspaceSlug: string }) {
  const { workspace } = await requireWorkspaceAccess(workspaceSlug);

  const activities = await db.activity.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      description: true,
      createdAt: true,
      deal: { select: { title: true } },
      contact: { select: { name: true } },
      company: { select: { name: true } },
      performer: { select: { name: true } },
    },
  });

  const activityItems: ActivityItem[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description ?? "",
    createdAt: a.createdAt.toISOString(),
    entityName: a.deal?.title ?? a.contact?.name ?? a.company?.name ?? null,
    performerName: a.performer?.name ?? null,
  }));

  return (
    <header className="relative h-14 border-b bg-background flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Menu Principal</SheetTitle>
            <SheetDescription className="sr-only">Navegação do sistema</SheetDescription>
            <Sidebar workspaceSlug={workspaceSlug} className="flex" />
          </SheetContent>
        </Sheet>
        <TopbarSearch workspaceSlug={workspaceSlug} />
      </div>
      <div className="flex items-center gap-4">
        <NotificationsNav activities={activityItems} />
      </div>
    </header>
  );
}
