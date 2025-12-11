import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SaleNotification {
  id: string;
  type: 'sale_confirmed';
  title: string;
  message: string;
  amount: number;
  buyerName: string | null;
  buyerEmail: string;
  createdAt: string;
  read: boolean;
}

interface NotificationStore {
  notifications: SaleNotification[];
  soundEnabled: boolean;
  unreadCount: number;
  addNotification: (notification: SaleNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toggleSound: () => void;
  playSound: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      soundEnabled: true,
      unreadCount: 0,
      
      addNotification: (notification) => {
        set((state) => {
          // Prevent duplicates
          if (state.notifications.some(n => n.id === notification.id)) {
            return state;
          }
          
          const newNotifications = [notification, ...state.notifications].slice(0, 50); // Keep last 50
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.read).length,
          };
        });
      },
      
      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
          };
        });
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      
      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },
      
      playSound: () => {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.6;
          audio.play().catch(() => {});
        } catch (e) {
          // Ignore audio errors
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ 
        soundEnabled: state.soundEnabled,
        notifications: state.notifications.slice(0, 20), // Persist only last 20
      }),
    }
  )
);
