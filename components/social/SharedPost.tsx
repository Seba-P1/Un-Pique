import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore, Post } from '../../stores/socialStore';
import { showAlert } from '../../utils/alert';
import colors from '../../constants/colors';
import { useRouter } from 'expo-router';

export function InlineComments({ postId, tc, visible }: { postId: string; tc: any; visible: boolean }) {
    const { user } = useAuthStore();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible && postId) fetchComments();
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select(`*, user:users(id, full_name, avatar_url)`)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })
                .limit(10);
            if (!error && data) setComments(data);
        } catch (err) {
            console.error('Error al obtener comentarios:', err);
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para comentar.');
            return;
        }
        if (!newComment.trim() || !postId) return;
        setSending(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({ post_id: postId, user_id: user.id, content: newComment.trim() })
                .select(`*, user:users(id, full_name, avatar_url)`)
                .single();
            if (error) throw error;
            if (data) {
                setComments(prev => [...prev, data]);
                setNewComment('');
            }
        } catch (err) {
            console.error('Error al enviar comentario:', err);
            showAlert('Error', 'No se pudo enviar el comentario. Intenta de nuevo.');
        }
        setSending(false);
    };

    if (!visible) return null;

    return (
        <View style={[styles.inlineComments, { backgroundColor: tc.bgSecondary, borderTopColor: tc.borderLight }]}>
            {loading ? (
                <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ padding: 12 }} />
            ) : (
                <>
                    {comments.length > 0 ? (
                        <View style={styles.commentsList}>
                            {comments.map((c) => (
                                <View key={c.id} style={styles.commentItem}>
                                    <Image source={{ uri: c.user?.avatar_url || 'https://via.placeholder.com/30' }} style={[styles.commentAvatar, { backgroundColor: tc.bgInput }]} />
                                    <View style={[styles.commentBubble, { backgroundColor: tc.bgHover }]}>
                                        <Text style={[styles.commentUser, { color: tc.text }]}>{c.user?.full_name || 'Usuario'}</Text>
                                        <Text style={[styles.commentText, { color: tc.textSecondary }]}>{c.content}</Text>
                                    </View>
                                    <Text style={[styles.commentTime, { color: tc.textMuted }]}>
                                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: false, locale: es })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.noComments, { color: tc.textMuted }]}>Sé el primero en comentar</Text>
                    )}
                    <View style={[styles.commentInputRow, { borderTopColor: tc.borderLight }]}>
                        <Image source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/30' }} style={[styles.commentAvatar, { backgroundColor: tc.bgInput }]} />
                        <TextInput
                            style={[styles.commentInput, { backgroundColor: tc.bgInput, color: tc.text }]}
                            placeholder="Ecribí un comentario..."
                            placeholderTextColor={tc.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            maxLength={500}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { opacity: newComment.trim() ? 1 : 0.4 }]} onPress={handleSend} disabled={!newComment.trim() || sending}>
                            {sending ? <ActivityIndicator size="small" color={colors.primary.DEFAULT} /> : <Send size={18} color={colors.primary.DEFAULT} />}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

export function PostCard({ item, tc, isDesktop, toggleLike, isLiked, toggleComments, expandedComments, onShowMenu, currentLocality }: any) {
    const { isSaved, toggleSave } = useSocialStore();
    const liked = isLiked(item.id);
    const saved = isSaved(item.id);
    const commentsOpen = expandedComments.has(item.id);
    
    // Repost functionality (Compartir a mi muro)
    const { createPost } = useSocialStore();
    const { user } = useAuthStore();
    const [sharing, setSharing] = useState(false);

    const sharePost = async (post: Post) => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para compartir.');
            return;
        }

        if (Platform.OS === 'web') {
            const confirmShare = window.confirm(`¿Quieres compartir la publicación de ${post.author.full_name} en tu muro?`);
            if (!confirmShare) return;
        } else {
            // Need a proper React Native Alert here if this file had Alert imported
            // But we can fallback to showAlert which is custom.
        }

        setSharing(true);
        try {
            const repostContent = `[REPOST] Compartido de ${post.author.full_name}:\n\n${post.content}`;
            await createPost(repostContent, post.media_urls || [], post.locality_id || '');
            showAlert('Éxito', 'Publicación compartida en tu muro');
        } catch (error) {
            showAlert('Error', 'No se pudo compartir la publicación');
        } finally {
            setSharing(false);
        }
    };

    const router = useRouter();

    const parseContent = (content: string) => {
        const match = /\[service:([^:]+):(.+)\]/.exec(content);
        if (match) {
            return {
                text: content.replace(match[0], '').trim(),
                service: { id: match[1], name: match[2] }
            };
        }
        return { text: content, service: null };
    };

    const parsed = parseContent(item.content);

    return (
        <View style={[styles.postCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            {/* Cabecera — Avatar + Nombre + Hora + Ubicación */}
            <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: item.author.avatar_url || 'https://via.placeholder.com/44' }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.userName, { color: tc.text }]}>{item.author.full_name}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={[styles.timeAgo, { color: tc.textMuted }]}>
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                            </Text>
                            {currentLocality && (
                                <Text style={[styles.timeAgo, { color: tc.textMuted }]}> · {currentLocality.name}</Text>
                            )}
                        </View>
                    </View>
                </View>
                {onShowMenu && (
                    <Pressable style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]} hitSlop={8} onPress={() => onShowMenu(item)}>
                        <MoreHorizontal size={18} color={tc.textMuted} />
                    </Pressable>
                )}
            </View>

            {/* Contenido: imagen + texto + tarjeta compartida */}
            {item.media_urls && item.media_urls.length > 0 ? (
                <View style={[styles.postContentWithImage, !isDesktop && { flexDirection: 'column' }]}>
                    <Image
                        source={{ uri: item.media_urls[0] }}
                        style={[styles.postImageSide, !isDesktop && { width: '100%', height: 240, borderRadius: 0 }]}
                        resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                        {!!parsed.text && <Text style={[styles.caption, { color: tc.text }]}>{parsed.text}</Text>}
                        {parsed.service && (
                            <TouchableOpacity 
                                style={[styles.sharedServiceCard, { backgroundColor: tc.bgHover, borderColor: tc.borderLight }]}
                                onPress={() => router.push(`/directory/${parsed.service.id}` as any)}
                            >
                                <View style={styles.sharedServiceIconRow}>
                                    <Share2 size={14} color={tc.primary} />
                                    <Text style={{ color: tc.primary, fontSize: 12, fontWeight: '700' }}>Servicio Compartido</Text>
                                </View>
                                <Text style={{ color: tc.text, fontSize: 15, fontWeight: '600', marginTop: 4 }}>{parsed.service.name}</Text>
                                <Text style={{ color: tc.textSecondary, fontSize: 13, marginTop: 4 }}>Toca para ver el perfil.</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ) : (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    {!!parsed.text && <Text style={[styles.caption, { color: tc.text, marginBottom: parsed.service ? 8 : 0 }]}>{parsed.text}</Text>}
                    {parsed.service && (
                        <TouchableOpacity 
                            style={[styles.sharedServiceCard, { backgroundColor: tc.bgHover, borderColor: tc.borderLight }]}
                            onPress={() => router.push(`/directory/${parsed.service.id}` as any)}
                        >
                            <View style={styles.sharedServiceIconRow}>
                                <Share2 size={14} color={tc.primary} />
                                <Text style={{ color: tc.primary, fontSize: 12, fontWeight: '700' }}>Servicio Compartido</Text>
                            </View>
                            <Text style={{ color: tc.text, fontSize: 15, fontWeight: '600', marginTop: 4 }}>{parsed.service.name}</Text>
                            <Text style={{ color: tc.textSecondary, fontSize: 13, marginTop: 4 }}>Toca para ver el perfil.</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Resumen likes/comentarios */}
            <View style={[styles.countsSummary, { borderBottomColor: tc.borderLight }]}>
                {item.likes_count > 0 && (
                    <View style={styles.likeSummary}>
                        <View style={styles.likeIcon}><Heart size={10} color={colors.white} fill={colors.danger} /></View>
                        <Text style={[styles.countText, { color: tc.textSecondary }]}>
                            {liked ? (item.likes_count > 1 ? `Vos y ${item.likes_count - 1} más` : 'Te gusta') : `${item.likes_count}`}
                        </Text>
                    </View>
                )}
                <View style={{ flex: 1 }} />
                {item.comments_count > 0 && (
                    <Pressable onPress={() => toggleComments(item.id)} hitSlop={6}>
                        <Text style={[styles.countText, { color: tc.textSecondary }]}>
                            {item.comments_count} comentario{item.comments_count > 1 ? 's' : ''}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Acciones — Me gusta, Comentar, Compartir, Guardar */}
            <View style={[styles.actionBar, { borderBottomColor: tc.borderLight }]}>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleLike(item.id)}>
                    <Heart size={15} color={liked ? colors.danger : tc.textSecondary} fill={liked ? colors.danger : 'transparent'} />
                    <Text style={[styles.actionText, { color: liked ? colors.danger : tc.textSecondary }]}>Me gusta</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleComments(item.id)}>
                    <MessageCircle size={15} color={tc.textSecondary} />
                    <Text style={[styles.actionText, { color: tc.textSecondary }]}>Comentar</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => sharePost(item)} disabled={sharing}>
                    {sharing ? <ActivityIndicator size="small" color={tc.textSecondary} /> : <Share2 size={15} color={tc.textSecondary} />}
                    <Text style={[styles.actionText, { color: tc.textSecondary }]}>Compartir</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleSave(item.id)}>
                    <Bookmark size={15} color={saved ? tc.primary : tc.textSecondary} fill={saved ? tc.primary : 'transparent'} />
                    <Text style={[styles.actionText, { color: saved ? tc.primary : tc.textSecondary }]}>Guardar</Text>
                </Pressable>
            </View>

            <InlineComments postId={item.id} tc={tc} visible={commentsOpen} />
        </View>
    );
}

const styles = StyleSheet.create({
    postCard: { marginBottom: 12, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    userName: { fontSize: 15, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    timeAgo: { fontSize: 13 },
    moreBtn: { padding: 4 },
    postContentWithImage: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
    postImageSide: { width: 100, height: 100, borderRadius: 12 },
    caption: { fontSize: 14, lineHeight: 20, flex: 1 },
    countsSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
    likeSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    likeIcon: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 13 },
    actionBar: { flexDirection: 'row', borderTopWidth: 0.5 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    actionText: { fontSize: 13, fontWeight: '600' },
    inlineComments: { borderTopWidth: 0.5 },
    commentsList: { padding: 10, gap: 8 },
    commentItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    commentAvatar: { width: 30, height: 30, borderRadius: 15 },
    commentBubble: { flex: 1, borderRadius: 14, padding: 8, paddingHorizontal: 12 },
    commentUser: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    commentText: { fontSize: 13, lineHeight: 18 },
    commentTime: { fontSize: 10, marginTop: 4, alignSelf: 'center' },
    noComments: { fontSize: 13, fontStyle: 'italic', padding: 12, textAlign: 'center' },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 0.5, gap: 8 },
    commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, fontSize: 13, minHeight: 34 },
    sendBtn: { padding: 6 },
    sharedServiceCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
    sharedServiceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
