import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { UserNav } from "./user-nav";
import { NotificationsNav } from "./notifications-nav";

export function Topbar({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 lg:px-6">
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
        <div className="relative hidden md:flex w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Pesquisar..." 
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationsNav />
        <UserNav workspaceSlug={workspaceSlug} />
      </div>
    </header>
  );
}
