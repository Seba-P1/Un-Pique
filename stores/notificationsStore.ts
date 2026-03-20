import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    type: 'order' | 'message' | 'like' | 'comment' | 'service';
    title: string;
    body: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    createNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
    subscribeToNotifications: (userId: string) => void;
    unsubscribe: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,

    fetchNotifications: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const unreadCount = data?.filter((n) => !n.is_read).length || 0;
            set({ notifications: data || [], unreadCount, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error('Error fetching notifications:', error);
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));
        } catch (error: any) {
            console.error('Error marking all as read:', error);
        }
    },

    createNotification: async (notification) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert(notification);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error creating notification:', error);
        }
    },

    subscribeToNotifications: (userId: string) => {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    set((state) => ({
                        notifications: [payload.new as Notification, ...state.notifications],
                        unreadCount: state.unreadCount + 1,
                    }));
                }
            )
            .subscribe();

        // Store channel for cleanup
        (get() as any).channel = channel;
    },

    unsubscribe: () => {
        const channel = (get() as any).channel;
        if (channel) {
            supabase.removeChannel(channel);
        }
    },
}));
