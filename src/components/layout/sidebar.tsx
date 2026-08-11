"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Briefcase, 
  Users, 
  Settings, 
  LayoutDashboard, 
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ workspaceSlug, className }: { workspaceSlug: string, className?: string }) {
  const pathname = usePathname();

  const links = [
    { href: `/workspaces/${workspaceSlug}`, icon: LayoutDashboard, label: "Dashboard", exact: true },
    { href: `/workspaces/${workspaceSlug}/deals`, icon: Briefcase, label: "Pipeline" },
    { href: `/workspaces/${workspaceSlug}/contacts`, icon: Users, label: "Contatos" },
    { href: `/workspaces/${workspaceSlug}/automations`, icon: Network, label: "Automações" },
  ];

  return (
    <aside className={cn(`w-64 border-r bg-muted/40 flex-col h-full ${className ?? "hidden md:flex"}`)}>
      <div className="h-14 flex items-center border-b px-4">
        <div className="font-semibold text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">W</span>
          </div>
          Workspace
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact 
            ? pathname === link.href 
            : pathname?.startsWith(link.href);

          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
                isActive ? "bg-accent text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Link 
          href={`/workspaces/${workspaceSlug}/settings`} 
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
            pathname?.startsWith(`/workspaces/${workspaceSlug}/settings`) ? "bg-accent text-foreground" : "text-muted-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </div>
    </aside>
  );
}
