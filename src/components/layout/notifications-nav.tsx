"use client";

import { Bell, Mail, Phone, Users, FileText, ArrowRightLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ActivityItem = {
  id: string;
  type: "EMAIL" | "CALL" | "MEETING" | "NOTE_ADDED" | "STAGE_CHANGED" | "SYSTEM_LOG";
  description: string;
  createdAt: string;
  entityName: string | null;
  performerName: string | null;
};

const ICONS: Record<ActivityItem["type"], typeof Bell> = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Users,
  NOTE_ADDED: FileText,
  STAGE_CHANGED: ArrowRightLeft,
  SYSTEM_LOG: Bot,
};

/**
 * Central de notificações real (item 9 da auditoria de UX) — lê da tabela
 * Activity já existente (auditoria/timeline do CRM), que automações e ações
 * manuais (mudança de estágio, deal perdido, etc.) já populam. Antes disso
 * era um placeholder 100% estático, sem dado nenhum atrás.
 */
export function NotificationsNav({ activities }: { activities: ActivityItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          {activities.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>Atividade recente</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activities.length === 0 ? (
          <div className="flex h-32 items-center justify-center p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const Icon = ICONS[activity.type];
              return (
                <DropdownMenuItem key={activity.id} className="flex items-start gap-2.5 py-2.5 cursor-default">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground leading-snug">
                      {activity.description}
                      {activity.entityName && <span className="text-muted-foreground"> · {activity.entityName}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.performerName ? `${activity.performerName} · ` : ""}
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
