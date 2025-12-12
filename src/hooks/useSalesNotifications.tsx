import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { useNotificationStore, SaleNotification } from "@/stores/notificationStore";

export function useSalesNotifications(userId: string | undefined) {
  const { addNotification, playSound, soundEnabled } = useNotificationStore();
  const processedIds = useRef<Set<string>>(new Set());

  const handleNewSale = useCallback((newRecord: any) => {
    // Prevent duplicate notifications
    if (processedIds.current.has(newRecord.id)) {
      return;
    }
    processedIds.current.add(newRecord.id);
    
    const amount = Number(newRecord.amount).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    
    const buyerName = newRecord.buyer_name || newRecord.buyer_email || 'Cliente';
    
    const notification: SaleNotification = {
      id: newRecord.id,
      type: 'sale_confirmed',
      title: 'Nova venda confirmada!',
      message: `${buyerName} - ${amount}`,
      amount: Number(newRecord.amount),
      buyerName: newRecord.buyer_name,
      buyerEmail: newRecord.buyer_email,
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    addNotification(notification);
    
    // Play notification sound
    if (soundEnabled) {
      playSound();
    }

    toast.success(
      notification.title,
      {
        description: notification.message,
        duration: 8000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      }
    );
  }, [addNotification, playSound, soundEnabled]);

  useEffect(() => {
    if (!userId) return;

    // Use unique channel name per user to avoid conflicts
    const channelName = `pix-sales-${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_charges',
          filter: `seller_id=eq.${userId}`,
        },
        async (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Check if status changed to 'paid'
          if (oldRecord?.status !== 'paid' && newRecord?.status === 'paid') {
            handleNewSale(newRecord);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pix_charges',
          filter: `seller_id=eq.${userId}`,
        },
        async (payload) => {
          const newRecord = payload.new as any;
          
          // If inserted already as paid (edge case)
          if (newRecord?.status === 'paid') {
            handleNewSale(newRecord);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, handleNewSale]);
}
