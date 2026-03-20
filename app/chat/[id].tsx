import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const { messages, fetchMessages, sendMessage, subscribeToRoom, unsubscribeFromRoom, rooms } = useChatStore();
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const room = rooms.find(r => r.id === id);
    const roomMessages = messages[id] || [];
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (id) {
            fetchMessages(id);
            subscribeToRoom(id);
            return () => { unsubscribeFromRoom(id); };
        }
    }, [id]);

    const handleSend = async () => {
        if (!content.trim() || !id) return;
        setSending(true);
        try {
            await sendMessage(id, content.trim());
            setContent('');
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: any) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : [styles.theirMessage, { backgroundColor: tc.bgCard }]]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : { color: tc.text }]}>
                    {item.content}
                </Text>
                <Text style={[styles.messageTime, isMe ? styles.myMessageTime : { color: tc.textMuted }]}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: false, locale: es })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Image
                        source={{ uri: room?.other_user?.avatar_url || 'https://via.placeholder.com/40' }}
                        style={[styles.avatar, { backgroundColor: tc.bgInput }]}
                    />
                    <Text style={[styles.headerTitle, { color: tc.text }]}>{room?.other_user?.full_name || 'Chat'}</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={roomMessages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: tc.bgInput, color: tc.text }]}
                        placeholder="Escribí un mensaje..."
                        placeholderTextColor={tc.textMuted}
                        value={content}
                        onChangeText={setContent}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !content.trim() && { backgroundColor: tc.isDark ? '#374151' : colors.gray[300] }]}
                        onPress={handleSend}
                        disabled={!content.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Send size={20} color={colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    backButton: { marginRight: 12 },
    headerInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },
    listContent: { padding: 16, gap: 8 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 4 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary.DEFAULT, borderBottomRightRadius: 4 },
    theirMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: colors.white },
    messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myMessageTime: { color: 'rgba(255, 255, 255, 0.7)' },
    inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
    input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, minHeight: 40, maxHeight: 100, fontSize: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary.DEFAULT, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});
