import { useState } from "react";
import { Bell, CheckCircle, Volume2, VolumeX, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    soundEnabled,
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    toggleSound 
  } = useNotificationStore();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-[10px] font-bold flex items-center justify-center text-accent-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSound}
              title={soundEnabled ? "Desativar som" : "Ativar som"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearNotifications}
                  title="Limpar notificações"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1">
                Você receberá notificações quando uma venda for confirmada
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-secondary/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-full shrink-0",
                      notification.read ? "bg-muted" : "bg-green-500/10"
                    )}>
                      <CheckCircle className={cn(
                        "h-4 w-4",
                        notification.read ? "text-muted-foreground" : "text-green-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.buyerName || notification.buyerEmail}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-semibold text-green-500">
                          {notification.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
