import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
    id: string;
    room_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatRoom {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    created_at: string;
    // Joined data
    other_user?: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
    last_message?: string;
    unread_count?: number;
}

interface ChatState {
    rooms: ChatRoom[];
    messages: Record<string, ChatMessage[]>;
    loading: boolean;
    error: string | null;

    // Actions
    fetchRooms: (userId: string) => Promise<void>;
    fetchMessages: (roomId: string) => Promise<void>;
    sendMessage: (roomId: string, content: string) => Promise<void>;
    createRoom: (otherUserId: string) => Promise<string>;
    markMessagesAsRead: (roomId: string) => Promise<void>;
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    rooms: [],
    messages: {},
    loading: false,
    error: null,

    fetchRooms: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('chat_rooms')
                .select(`
                    *,
                    participant_1_profile:profiles!chat_rooms_participant_1_fkey(id, full_name, avatar_url),
                    participant_2_profile:profiles!chat_rooms_participant_2_fkey(id, full_name, avatar_url)
                `)
                .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Transform data to include other_user
            const rooms = data?.map((room: any) => ({
                ...room,
                other_user: room.participant_1 === userId
                    ? room.participant_2_profile
                    : room.participant_1_profile,
            })) || [];

            set({ rooms, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error('Error fetching chat rooms:', error);
        }
    },

    fetchMessages: async (roomId: string) => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            set((state) => ({
                messages: {
                    ...state.messages,
                    [roomId]: data || [],
                },
            }));
        } catch (error: any) {
            console.error('Error fetching messages:', error);
        }
    },

    sendMessage: async (roomId: string, content: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    content,
                });

            if (error) throw error;
        } catch (error: any) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    createRoom: async (otherUserId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if room already exists
            const { data: existing } = await supabase
                .from('chat_rooms')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
                .single();

            if (existing) return existing.id;

            // Create new room
            const { data, error } = await supabase
                .from('chat_rooms')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId,
                })
                .select()
                .single();

            if (error) throw error;
            return data.id;
        } catch (error: any) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    },

    markMessagesAsRead: async (roomId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('room_id', roomId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error marking messages as read:', error);
        }
    },

    subscribeToRoom: (roomId: string) => {
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [roomId]: [...(state.messages[roomId] || []), payload.new as ChatMessage],
                        },
                    }));
                }
            )
            .subscribe();

        // Store channel for cleanup
        (get() as any)[`channel_${roomId}`] = channel;
    },

    unsubscribeFromRoom: (roomId: string) => {
        const channel = (get() as any)[`channel_${roomId}`];
        if (channel) {
            supabase.removeChannel(channel);
            delete (get() as any)[`channel_${roomId}`];
        }
    },
}));
