import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const { user } = useAuth();
  const permissionGranted = useRef(false);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        permissionGranted.current = permission === "granted";
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      permissionGranted.current = true;
    }
  }, []);

  // Subscribe to realtime transaction updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as { status: string; amount: number };
          const oldRecord = payload.old as { status: string };

          // Only notify when status changes to 'paid'
          if (newRecord.status === 'paid' && oldRecord.status !== 'paid') {
            const amount = (newRecord.amount / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            });

            // Show toast notification
            toast({
              title: "🎉 Venda Aprovada!",
              description: `Você recebeu uma venda de ${amount}`,
            });

            // Show browser/mobile notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Venda Aprovada! 🎉", {
                body: `Você recebeu uma venda de ${amount}`,
                icon: "/favicon.png",
                badge: "/favicon.png",
                tag: "sale-notification",
                requireInteraction: true
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      permissionGranted.current = permission === "granted";
      return permission === "granted";
    }
    return false;
  };

  return { requestPermission };
};
