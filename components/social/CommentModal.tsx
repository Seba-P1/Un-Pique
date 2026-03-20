import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Pressable
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import colors from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommentModalProps {
    visible: boolean;
    postId: string | null;
    onClose: () => void;
}

export function CommentModal({ visible, postId, onClose }: CommentModalProps) {
    const { user } = useAuthStore();
    const tc = useThemeColors();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            fetchComments();
        }
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setComments(data);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!newComment.trim() || !user || !postId) return;

        setSending(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: newComment.trim()
                })
                .select(`
                    *,
                    user:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (!error && data) {
                setComments([...comments, data]);
                setNewComment('');
            }
        } catch (err) {
            console.error('Error sending comment:', err);
        }
        setSending(false);
    };

    if (!postId) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: tc.bg }]}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight, backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Comentarios</Text>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeBtn,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                        ]}
                    >
                        <X size={22} color={tc.text} />
                    </Pressable>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary.DEFAULT} />
                    </View>
                ) : (
                    <FlatList
                        data={comments}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <View style={styles.commentItem}>
                                <Image
                                    source={{ uri: item.user?.avatar_url || 'https://via.placeholder.com/40' }}
                                    style={[styles.avatar, { backgroundColor: tc.bgInput }]}
                                />
                                <View style={[styles.commentContent, { backgroundColor: tc.bgSecondary }]}>
                                    <View style={styles.commentHeader}>
                                        <Text style={[styles.username, { color: tc.text }]}>{item.user?.full_name || 'Usuario'}</Text>
                                        <Text style={[styles.time, { color: tc.textMuted }]}>
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.text, { color: tc.textSecondary }]}>{item.content}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: tc.textMuted }]}>Sé el primero en comentar, che.</Text>
                            </View>
                        }
                    />
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                    <View style={[styles.inputContainer, { borderTopColor: tc.borderLight, backgroundColor: tc.bgCard }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: tc.bgInput, color: tc.text }]}
                            placeholder="Escribí un comentario..."
                            placeholderTextColor={tc.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendButton,
                                !newComment.trim() && styles.sendButtonDisabled,
                                pressed && newComment.trim() && { opacity: 0.8, transform: [{ scale: 0.92 }] }
                            ]}
                            onPress={handleSend}
                            disabled={!newComment.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Send size={18} color={colors.white} />
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    commentItem: {
        flexDirection: 'row',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    commentContent: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 4,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'baseline',
    },
    username: {
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    time: {
        fontSize: 11,
        fontFamily: 'Nunito Sans',
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Nunito Sans',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontStyle: 'italic',
        fontFamily: 'Nunito Sans',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40,
        maxHeight: 100,
        fontSize: 14,
        fontFamily: 'Nunito Sans',
    },
    sendButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.3)' } : {
            elevation: 3,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        }),
    },
    sendButtonDisabled: {
        backgroundColor: colors.gray[400],
        opacity: 0.5,
    },
});
