import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export function useSalesNotifications(userId: string | undefined) {
  const previousStatusRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('sales-notifications')
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
            const amount = Number(newRecord.amount).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });
            
            const buyerName = newRecord.buyer_name || newRecord.buyer_email || 'Cliente';
            
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {
              // Ignore audio errors
            }

            toast.success(
              `Nova venda confirmada!`,
              {
                description: `${buyerName} - ${amount}`,
                duration: 8000,
                icon: <CheckCircle className="h-5 w-5 text-green-500" />,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
