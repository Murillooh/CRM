import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { NotificationsNav } from "./notifications-nav";
import { TopbarSearch } from "./topbar-search";

export function Topbar({ workspaceSlug }: { workspaceSlug: string }) {
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
        <NotificationsNav />
      </div>
    </header>
  );
}
