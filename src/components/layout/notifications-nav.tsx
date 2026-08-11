"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          {/* Indicador de notificação não lida (opcional) */}
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600"></span> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex h-32 items-center justify-center p-4 text-center">
          <p className="text-sm text-muted-foreground">Você não tem novas notificações no momento.</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
