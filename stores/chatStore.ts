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
    business_id?: string | null;
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
    unreadCount: number;
    loading: boolean;
    error: string | null;

    // Actions
    fetchRooms: (userId: string) => Promise<void>;
    fetchUnreadCount: (userId: string) => Promise<void>;
    fetchMessages: (roomId: string) => Promise<void>;
    sendMessage: (roomId: string, content: string) => Promise<void>;
    createRoom: (otherUserId: string, businessId?: string) => Promise<string>;
    markMessagesAsRead: (roomId: string) => Promise<void>;
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    deleteRoom: (roomId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    rooms: [],
    messages: {},
    unreadCount: 0,
    loading: false,
    error: null,

    fetchUnreadCount: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('room_id')
                .neq('sender_id', userId)
                .eq('is_read', false);
            if (error) throw error;
            const unreadPerRoom: Record<string, number> = {};
            data?.forEach((m: any) => {
                unreadPerRoom[m.room_id] = (unreadPerRoom[m.room_id] || 0) + 1;
            });
            set((state) => ({ 
                unreadCount: Object.keys(unreadPerRoom).length,
                rooms: state.rooms.map(r => ({
                    ...r,
                    unread_count: unreadPerRoom[r.id] || 0
                }))
            }));
        } catch (error: any) {
            console.error('Error fetching unread count:', error);
        }
    },

    fetchRooms: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const { data: roomsData, error } = await supabase
                .from('chat_rooms')
                .select('*, chat_messages!inner(id, created_at)')
                .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
                .not('deleted_by_user_ids', 'cs', `{"${userId}"}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            if (!roomsData || roomsData.length === 0) {
                set({ rooms: [], loading: false });
                return;
            }

            // Extract all other user IDs and business IDs
            const otherUserIds = roomsData.map((r: any) => r.participant_1 === userId ? r.participant_2 : r.participant_1);
            const businessIds = roomsData.map((r: any) => r.business_id).filter(Boolean);

            // Fetch profiles manually to avoid PGRST200 foreign key errors
            const { data: profilesData } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .in('id', otherUserIds);

            // Fetch businesses manually
            let businessesMap: any = {};
            if (businessIds.length > 0) {
                const { data: businessesData } = await supabase
                    .from('businesses')
                    .select('id, name, logo_url, owner_id')
                    .in('id', businessIds);
                businessesMap = (businessesData || []).reduce((acc: any, b: any) => {
                    acc[b.id] = b;
                    return acc;
                }, {});
            }

            const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});

            // Fetch unread counts
            const { data: unreadData } = await supabase
                .from('chat_messages')
                .select('room_id')
                .neq('sender_id', userId)
                .eq('is_read', false);
            
            const unreadPerRoom: Record<string, number> = {};
            unreadData?.forEach((m: any) => {
                unreadPerRoom[m.room_id] = (unreadPerRoom[m.room_id] || 0) + 1;
            });

            // Transform data to include other_user
            const rooms = roomsData.map((room: any) => {
                const otherUserId = room.participant_1 === userId ? room.participant_2 : room.participant_1;
                const business = room.business_id ? businessesMap[room.business_id] : null;
                const otherProfile = profilesMap[otherUserId] || { id: otherUserId, full_name: 'Usuario', avatar_url: null };

                let displayUser = { ...otherProfile };

                if (business) {
                    displayUser = {
                        id: otherUserId,
                        full_name: business.name,
                        avatar_url: business.logo_url
                    };
                }

                return {
                    ...room,
                    other_user: displayUser,
                    unread_count: unreadPerRoom[room.id] || 0
                };
            });

            // For rooms with cleared_at, fetch the latest visible message
            const roomsWithClearedAt = rooms.filter((r: any) => r.cleared_at?.[userId]);
            if (roomsWithClearedAt.length > 0) {
                await Promise.all(roomsWithClearedAt.map(async (room: any) => {
                    const clearedAt = room.cleared_at[userId];
                    const { data: latestMsg } = await supabase
                        .from('chat_messages')
                        .select('content, created_at')
                        .eq('room_id', room.id)
                        .gt('created_at', clearedAt)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (latestMsg) {
                        room.last_message = latestMsg.content;
                        room.last_message_at = latestMsg.created_at;
                    } else {
                        // No messages after cleared_at — show empty state
                        room.last_message = '';
                        room.last_message_at = room.created_at;
                    }
                }));
            }

            set({ rooms, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error('Error fetching chat rooms:', error);
        }
    },

    fetchMessages: async (roomId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const { data: room } = await supabase
                .from('chat_rooms')
                .select('cleared_at')
                .eq('id', roomId)
                .single();
                
            const clearedAt = userId && room?.cleared_at ? room.cleared_at[userId] : null;

            let query = supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId);

            if (clearedAt) {
                query = query.gt('created_at', clearedAt);
            }

            const { data, error } = await query.order('created_at', { ascending: true });

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

            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            const optimisticMsg: ChatMessage = {
                id: tempId,
                room_id: roomId,
                sender_id: user.id,
                content,
                is_read: false,
                created_at: new Date().toISOString()
            };

            set((state) => ({
                messages: {
                    ...state.messages,
                    [roomId]: [...(state.messages[roomId] || []), optimisticMsg]
                }
            }));

            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    content,
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic with real
            set((state) => ({
                messages: {
                    ...state.messages,
                    [roomId]: state.messages[roomId].map(m => m.id === tempId ? data : m)
                }
            }));
        } catch (error: any) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    createRoom: async (otherUserId: string, businessId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if room already exists
            let query = supabase
                .from('chat_rooms')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`);
            
            if (businessId) {
                query = query.eq('business_id', businessId);
            } else {
                query = query.is('business_id', null);
            }

            const { data: existing } = await query.single();

            if (existing) return existing.id;

            // Create new room
            const { data, error } = await supabase
                .from('chat_rooms')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId,
                    business_id: businessId || null
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

            set((state) => {
                const room = state.rooms.find(r => r.id === roomId);
                const hasUnread = room?.unread_count && room.unread_count > 0;
                return {
                    rooms: state.rooms.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r),
                    unreadCount: hasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
                };
            });

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

    deleteRoom: async (roomId: string) => {
        try {
            const { error } = await supabase
                .from('chat_rooms')
                .delete()
                .eq('id', roomId);
            if (error) throw error;

            set((state) => ({
                rooms: state.rooms.filter(r => r.id !== roomId),
            }));
        } catch (error: any) {
            console.error('Error deleting room:', error);
            throw error;
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
                    set((state) => {
                        const currentMessages = state.messages[roomId] || [];
                        // Check if message already exists (from optimistic update)
                        if (currentMessages.find(m => m.id === payload.new.id)) return state;
                        
                        return {
                            messages: {
                                ...state.messages,
                                [roomId]: [...currentMessages, payload.new as ChatMessage],
                            },
                        };
                    });
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
