import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking, Modal, Pressable, Animated, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Smile, Paperclip, Image as ImageIcon, Mic, MoreVertical, FileText, X, Trash2, User } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import colors from '../../constants/colors';
import { useChatStore, ChatMessage } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { supabase } from '../../lib/supabase';
import { pickImage, uploadImage } from '../../services/imageUpload';
import { pickAndUploadFile, uploadAudioFile } from '../../services/fileUpload';
import AudioPlayer from '../../components/chat/AudioPlayer';

const EMOJIS = ['😀','😂','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','✨','🎉','🙏','💪','🤝','🍕','🍔','☕','🎵','📍','🏠','🔑','💡','⭐','💰','📱','🚗','🌟','👋'];

const ChatImage = ({ url, onPress }: { url: string, onPress: (url: string) => void }) => {
    const [size, setSize] = useState({ width: 220, height: 165 });
    return (
        <TouchableOpacity onPress={() => onPress(url)} activeOpacity={0.9}>
            <Image source={{ uri: url }}
                style={{ width: size.width, height: size.height, borderRadius: 12 }}
                resizeMode="cover"
                onLoad={(e) => {
                    if (Platform.OS === 'web') return;
                    const source = e.nativeEvent?.source;
                    if (!source?.width || !source?.height) return;
                    const ratio = source.height / source.width;
                    setSize({ width: 220, height: Math.min(Math.round(220 * ratio), 300) });
                }} />
        </TouchableOpacity>
    );
};

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const { messages, fetchMessages, sendMessage, subscribeToRoom, unsubscribeFromRoom, rooms, markMessagesAsRead } = useChatStore();
    const { user } = useAuthStore();
    
    const [otherUser, setOtherUser] = useState<any>(null);
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [sendingMedia, setSendingMedia] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const recording = useRef<Audio.Recording | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseDotAnim = useRef(new Animated.Value(1)).current;
    const recordingTimer = useRef<NodeJS.Timeout | number | null>(null);
    const cancelRecordingRef = useRef(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const roomMessages = messages[id] || [];

    useEffect(() => {
        const initChat = async () => {
            if (!id || !user) return;
            setInitialLoading(true);
            
            let roomFromStore = rooms.find(r => r.id === id);
            if (!roomFromStore) {
                const { data } = await supabase.from('chat_rooms').select('*').eq('id', id).single();
                if (data) {
                    const otherId = data.participant_1 === user.id ? data.participant_2 : data.participant_1;
                    const { data: profile } = await supabase.from('users').select('id, full_name, avatar_url').eq('id', otherId).single();
                    setOtherUser({ ...profile, id: otherId });
                }
            } else {
                setOtherUser(roomFromStore.other_user);
            }
            
            await fetchMessages(id);
            subscribeToRoom(id);

            // markMessagesAsRead actualiza el store localmente Y hace el UPDATE en DB
            // El unreadCount global se recalcula desde los rooms sin queries adicionales
            await markMessagesAsRead(id);
            
            setInitialLoading(false);
            // No es necesario fetchRooms ni fetchUnreadCount acá —
            // markMessagesAsRead ya actualizó el badge en el store localmente
        };

        initChat();

        return () => {
            if (id) unsubscribeFromRoom(id);
        };
    }, [id, user]);

    // Re-marcar como leído cada vez que la pantalla gana foco
    useFocusEffect(
        useCallback(() => {
            if (id && user) {
                markMessagesAsRead(id);
            }
        }, [id, user])
    );

    useEffect(() => {
        if (roomMessages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [roomMessages.length]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseDotAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseDotAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseDotAnim.stopAnimation();
            pulseDotAnim.setValue(1);
        }
    }, [isRecording]);

    const handleBack = () => {
        // router.back() vuelve a la pantalla anterior con el drawer visible
        // Si no hay historial (acceso directo a la URL del chat), ir a Social
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/social' as any);
        }
    };

    const handleDeleteChat = () => {
        const userId = user?.id;
        if (!userId || !id) return;
        
        setShowChatMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !id) return;
        setInputText('');
        await sendMessage(id, text);
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const handleKeyPress = (e: any) => {
        if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = async () => {
        if (sendingMedia || !id) return;
        setSendingMedia(true);
        try {
            const uri = await pickImage();
            if (!uri) return;
            const result = await uploadImage(uri, 'chats', `messages/${Date.now()}`, {
                maxWidth: 1080,
                maxHeight: 1080,
                quality: 0.72
            });
            if (result?.url) await sendMessage(id, `[image:${result.url}]`);
        } catch (e) {
            console.error(e);
        } finally {
            setSendingMedia(false);
        }
    };

    const handleFileUpload = async () => {
        if (sendingMedia || !id) return;
        setSendingMedia(true);
        try {
            const result = await pickAndUploadFile('chats', 'files');
            if (result?.url) await sendMessage(id, `[file:${result.url}|${result.name}]`);
        } catch (e) {
            console.error(e);
        } finally {
            setSendingMedia(false);
        }
    };

    const formatRecordingTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const handleStartRecording = async () => {
        if (Platform.OS === 'web' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            Alert.alert('Error', 'La grabación de audio requiere HTTPS en producción. Funciona en localhost.');
            return;
        }
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recording.current = r;
            setIsRecording(true);
            
            cancelRecordingRef.current = false;
            setRecordingDuration(0);
            recordingTimer.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const handleCancelRecording = async () => {
        cancelRecordingRef.current = true;
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        setRecordingDuration(0);
        if (recording.current) {
            await recording.current.stopAndUnloadAsync();
            recording.current = null;
        }
        setIsRecording(false);
    };

    const handleStopAndSendRecording = async () => {
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        setRecordingDuration(0);
        if (!recording.current || !id) {
            setIsRecording(false);
            return;
        }
        try {
            await recording.current.stopAndUnloadAsync();
            const uri = recording.current.getURI();
            recording.current = null;
            setIsRecording(false);
            if (!uri) return;
            
            setSendingMedia(true);
            const url = await uploadAudioFile(uri);
            await sendMessage(id, `[audio:${url}]`);
        } catch (err) {
            console.error('Failed to send recording', err);
        } finally {
            setSendingMedia(false);
        }
    };

    const parseMessageContent = (content: string, isOwn: boolean) => {
        if (content.startsWith('[image:')) {
            const url = content.slice(7, -1);
            return <ChatImage url={url} onPress={setFullscreenImage} />;
        }
        if (content.startsWith('[audio:')) {
            const url = content.slice(7, -1);
            return <AudioPlayer uri={url} isOwn={isOwn} tc={tc} />;
        }
        if (content.startsWith('[file:')) {
            const parts = content.slice(6, -1).split('|');
            const url = parts[0];
            const name = parts[1] || 'Archivo';
            return (
                <TouchableOpacity style={styles.fileRow} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
                    <FileText size={20} color={isOwn ? '#fff' : tc.text} />
                    <Text style={[styles.fileText, { color: isOwn ? '#fff' : tc.text }]} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
            );
        }
        return <Text style={[styles.messageText, { color: isOwn ? '#fff' : tc.text }]}>{content}</Text>;
    };

    const getDateLabel = (date: Date) => {
        if (isToday(date)) return 'Hoy';
        if (isYesterday(date)) return 'Ayer';
        if (isThisWeek(date)) return format(date, 'EEEE', { locale: es }).replace(/^\w/, c => c.toUpperCase());
        return format(date, 'dd/MM', { locale: es });
    };

    const renderMessage = ({ item, index }: { item: ChatMessage, index: number }) => {
        const isMe = item.sender_id === user?.id;
        const msgDate = new Date(item.created_at);
        const prevMsg = index > 0 ? roomMessages[index - 1] : null;
        const showDateSeparator = !prevMsg || getDateLabel(msgDate) !== getDateLabel(new Date(prevMsg.created_at));
        const isConsecutive = prevMsg && prevMsg.sender_id === item.sender_id && !showDateSeparator;

        const isMedia = item.content.startsWith('[image:') || item.content.startsWith('[audio:');

        return (
            <View>
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <View style={[styles.dateLine, { backgroundColor: tc.borderLight }]} />
                        <Text style={[styles.dateText, { color: tc.textMuted }]}>{getDateLabel(msgDate)}</Text>
                        <View style={[styles.dateLine, { backgroundColor: tc.borderLight }]} />
                    </View>
                )}
                
                <View style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.theirMessageRow,
                    { marginBottom: isConsecutive ? 2 : 10 }
                ]}>
                    <View style={[
                        styles.messageBubble,
                        isMe ? styles.myMessage : { backgroundColor: tc.bgInput },
                        isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 },
                        isMedia ? { padding: 4 } : { paddingHorizontal: 14, paddingVertical: 10 }
                    ]}>
                        {parseMessageContent(item.content, isMe)}
                    </View>
                    <Text style={[
                        styles.messageTime,
                        { color: tc.textMuted, alignSelf: isMe ? 'flex-end' : 'flex-start' }
                    ]}>
                        {format(msgDate, 'HH:mm')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Image source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/40' }} style={[styles.avatar, { borderColor: tc.borderLight }]} />
                    <Text style={[styles.headerTitle, { color: tc.text }]}>{otherUser?.full_name || 'Cargando...'}</Text>
                </View>
                <TouchableOpacity style={styles.infoBtn} onPress={() => setShowChatMenu(true)}>
                    <MoreVertical size={22} color={tc.text} />
                </TouchableOpacity>
            </View>

            {initialLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={roomMessages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <Modal visible={showEmojiPicker} transparent animationType="fade" onRequestClose={() => setShowEmojiPicker(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowEmojiPicker(false)}>
                    <Pressable style={[styles.emojiPicker, { backgroundColor: tc.bgCard }]} onPress={e => e.stopPropagation()}>
                        {EMOJIS.map(emoji => (
                            <TouchableOpacity key={emoji} style={styles.emojiCell} onPress={() => setInputText(p => p + emoji)}>
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={!!fullscreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setFullscreenImage(null)}
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                    {fullscreenImage && (
                        <Image source={{ uri: fullscreenImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
                    )}
                </View>
            </Modal>

            <Modal visible={showChatMenu} transparent={true} animationType="fade" onRequestClose={() => setShowChatMenu(false)}>
                <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={() => setShowChatMenu(false)}>
                    <Pressable style={[styles.bottomSheet, { backgroundColor: tc.bgCard }]} onPress={e => e.stopPropagation()}>
                        <View style={[styles.bottomSheetHandle, { backgroundColor: tc.borderLight }]} />
                        
                        <TouchableOpacity style={styles.bottomSheetOption} onPress={() => { setShowChatMenu(false); if(otherUser?.id) router.push(`/profile/${otherUser.id}` as any); }}>
                            <User size={20} color={tc.text} />
                            <Text style={[styles.bottomSheetOptionText, { color: tc.text }]}>Ver perfil</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.bottomSheetOption} onPress={handleDeleteChat}>
                            <Trash2 size={20} color="#ef4444" />
                            <Text style={[styles.bottomSheetOptionText, { color: '#ef4444' }]}>Eliminar conversación</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.bottomSheetOption} onPress={() => setShowChatMenu(false)}>
                            <X size={20} color={tc.textMuted} />
                            <Text style={[styles.bottomSheetOptionText, { color: tc.textMuted }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {isRecording ? (
                    <View style={[styles.inputBar, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight, alignItems: 'center', paddingVertical: 12 }]}>
                        <TouchableOpacity onPress={handleCancelRecording} style={styles.cancelRecordBtn}>
                            <Trash2 size={20} color="#ef4444" />
                            <Text style={styles.cancelRecordText}>Cancelar</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.recordIndicator}>
                            <Animated.View style={[styles.recordDot, { opacity: pulseDotAnim }]} />
                            <Text style={[styles.recordTime, { color: tc.text }]}>
                                {formatRecordingTime(recordingDuration)}
                            </Text>
                        </View>
                        
                        <TouchableOpacity onPress={handleStopAndSendRecording} style={styles.sendRecordBtn}>
                            <Send size={18} color="#fff" style={{ marginLeft: -2 }} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.inputBar, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                        <View style={styles.leftActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <Smile size={22} color={tc.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleImageUpload} disabled={sendingMedia}>
                                <ImageIcon size={22} color={tc.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleFileUpload} disabled={sendingMedia}>
                                <Paperclip size={22} color={tc.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: tc.bgInput, color: tc.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            placeholder="Escribí un mensaje..."
                            placeholderTextColor={tc.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            onKeyPress={handleKeyPress}
                        />

                        <View style={styles.rightActions}>
                            {sendingMedia ? (
                                <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={styles.actionBtn} />
                            ) : inputText.trim() ? (
                                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                                    <Send size={20} color={colors.white} style={{ marginLeft: -2 }} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.micBtn} 
                                    onPress={handleStartRecording}
                                    activeOpacity={0.8}
                                >
                                    <Mic size={22} color={tc.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

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
                                onPress={() => setShowDeleteConfirm(false)}
                                style={{ padding: 10 }}>
                                <Text style={{ color: tc.textMuted, fontSize: 15 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    setShowDeleteConfirm(false);
                                    const userId = user?.id;
                                    if (!userId || !id) return;
                                    console.log('Deleting chat:', { roomId: id, userId });

                                    const { error } = await supabase.rpc('append_to_deleted_chats', {
                                        room_id: id,
                                        user_id: userId
                                    });
                                    if (error) {
                                        console.error('RPC error:', error);
                                    } else {
                                        await useChatStore.getState().fetchRooms(userId);
                                        router.replace('/chat' as any);
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
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    backButton: { marginRight: 16 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1 },
    headerTitle: { fontSize: 15, fontWeight: '700' },
    infoBtn: { padding: 4 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 16, paddingVertical: 16 },
    
    dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
    dateLine: { flex: 1, height: 1 },
    dateText: { fontSize: 11, fontWeight: '500' },
    
    messageRow: { flexDirection: 'column' },
    myMessageRow: { alignItems: 'flex-end' },
    theirMessageRow: { alignItems: 'flex-start' },
    
    messageBubble: {
        maxWidth: '78%',
        borderRadius: 18,
    },
    myMessage: { backgroundColor: '#FF6B35' },
    
    messageText: { fontSize: 15, lineHeight: 22 },
    messageTime: { fontSize: 10, marginTop: 2 },
    
    fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
    fileText: { fontSize: 13, fontWeight: '500', maxWidth: 180 },
    
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
    leftActions: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 6 },
    actionBtn: { padding: 6 },
    
    input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
    
    rightActions: { paddingBottom: 4 },
    sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    micBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    
    cancelRecordBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cancelRecordText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
    recordIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
    recordTime: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
    sendRecordBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    
    modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    emojiPicker: { width: 280, borderRadius: 16, padding: 12, marginBottom: 80, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    emojiCell: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    emojiText: { fontSize: 22 },
    
    bottomSheet: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    bottomSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    bottomSheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    bottomSheetOptionText: { fontSize: 16, fontWeight: '500' },
});
