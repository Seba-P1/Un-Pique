import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Trash2, X } from 'lucide-react-native';
import { format, isToday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { useChatStore, ChatRoom } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'HH:mm', { locale: es });
    if (isThisWeek(d)) return format(d, 'eee', { locale: es });
    return format(d, 'dd/MM', { locale: es });
};

const ChatRow = ({ item, index, tc, router, setMenuRoom }: { item: ChatRoom, index: number, tc: any, router: any, setMenuRoom: (room: ChatRoom) => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(6)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay: index * 40, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 250, delay: index * 40, useNativeDriver: true })
        ]).start();
    }, [index]);

    const otherUser = item.other_user;
    if (!otherUser) return null;

    let lastMsgText = item.last_message || '';
    if (lastMsgText.startsWith('[image:')) lastMsgText = '📷 Imagen';
    else if (lastMsgText.startsWith('[audio:')) lastMsgText = '🎤 Audio';
    else if (lastMsgText.startsWith('[file:')) lastMsgText = '📎 Archivo';
    else if (lastMsgText.length > 40) lastMsgText = lastMsgText.substring(0, 40) + '...';

    const isUnread = item.unread_count && item.unread_count > 0;
    const initial = otherUser.full_name ? otherUser.full_name.charAt(0).toUpperCase() : '?';

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity 
                style={styles.row}
                onPress={() => router.push(`/chat/${item.id}` as any)}
                onLongPress={() => setMenuRoom(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarContainer, { borderColor: tc.borderLight }]}>
                    {otherUser.avatar_url ? (
                        <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitial}>{initial}</Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.centerCol}>
                    <Text style={[styles.nameText, { color: tc.text }]} numberOfLines={1}>{otherUser.full_name || 'Usuario'}</Text>
                    <Text style={[styles.msgText, { color: isUnread ? tc.text : tc.textMuted, fontWeight: isUnread ? '600' : '400' }]} numberOfLines={1}>
                        {lastMsgText || 'Inicia la conversación'}
                    </Text>
                </View>
                
                <View style={styles.rightCol}>
                    <Text style={[styles.timeText, { color: tc.textMuted }]}>{getRelativeTime(item.last_message_at)}</Text>
                    {isUnread ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.unread_count}</Text>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ChatListScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { rooms, loading, fetchRooms, fetchUnreadCount } = useChatStore();
    const { user } = useAuthStore();
    const [menuRoom, setMenuRoom] = useState<ChatRoom | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchRooms(user.id);
                fetchUnreadCount(user.id);
            }
        }, [user])
    );

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const handleDeleteChat = () => {
        const userId = user?.id;
        if (!menuRoom || !userId) return;
        
        setRoomToDelete(menuRoom.id);
        setMenuRoom(null);
        setShowDeleteConfirm(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Mensajes</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : rooms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MessageCircle size={64} color={tc.borderLight} strokeWidth={1.5} />
                    <Text style={[styles.emptyTitle, { color: tc.text }]}>No tenés conversaciones</Text>
                    <Text style={[styles.emptySubtitle, { color: tc.textMuted }]}>
                        Escribile a alguien desde su perfil
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={({ item, index }) => <ChatRow item={item} index={index} tc={tc} router={router} setMenuRoom={setMenuRoom} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: tc.borderLight }]} />}
                />
            )}

            <Modal visible={!!menuRoom} transparent={true} animationType="fade" onRequestClose={() => setMenuRoom(null)}>
                <Pressable style={styles.modalOverlay} onPress={() => setMenuRoom(null)}>
                    <Pressable style={[styles.bottomSheet, { backgroundColor: tc.bgCard }]} onPress={e => e.stopPropagation()}>
                        <View style={[styles.bottomSheetHandle, { backgroundColor: tc.borderLight }]} />
                        <TouchableOpacity style={styles.bottomSheetOption} onPress={handleDeleteChat}>
                            <Trash2 size={20} color="#ef4444" />
                            <Text style={[styles.bottomSheetOptionText, { color: '#ef4444' }]}>Eliminar conversación</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bottomSheetOption} onPress={() => setMenuRoom(null)}>
                            <X size={20} color={tc.textMuted} />
                            <Text style={[styles.bottomSheetOptionText, { color: tc.textMuted }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {showDeleteConfirm && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 999
                }}>
                    <View style={{
                        backgroundColor: tc.bgCard,
                        borderRadius: 16,
                        padding: 24,
                        width: 300,
                        gap: 16
                    }}>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: tc.text }}>
                            Eliminar conversación
                        </Text>
                        <Text style={{ fontSize: 14, color: tc.textMuted }}>
                            Se eliminará para vos. El otro usuario seguirá viendo los mensajes.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowDeleteConfirm(false);
                                    setRoomToDelete(null);
                                }}
                                style={{ padding: 10 }}>
                                <Text style={{ color: tc.textMuted, fontSize: 15 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    setShowDeleteConfirm(false);
                                    const userId = user?.id;
                                    
                                    if (!userId || !roomToDelete) {
                                        setRoomToDelete(null);
                                        return;
                                    }
                                    
                                    console.log('Index deleting:', { roomId: roomToDelete, userId });

                                    const { error } = await supabase.rpc('append_to_deleted_chats', {
                                        room_id: roomToDelete,
                                        user_id: userId
                                    });
                                    setRoomToDelete(null);
                                    
                                    if (error) {
                                        console.error('RPC error:', error);
                                    } else {
                                        await useChatStore.getState().fetchRooms(userId);
                                    }
                                }}
                                style={{
                                    backgroundColor: '#ef4444',
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 8
                                }}>
                                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                                    Eliminar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: 24,
    },
    row: {
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#FF6B35',
        fontSize: 18,
        fontWeight: '700',
        backgroundColor: 'transparent',
    },
    centerCol: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    msgText: {
        fontSize: 13,
    },
    rightCol: {
        alignItems: 'flex-end',
        gap: 4,
        minWidth: 40,
    },
    timeText: {
        fontSize: 11,
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        marginHorizontal: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    bottomSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    bottomSheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    bottomSheetOptionText: { fontSize: 16, fontWeight: '500' },
});
