// Pantalla Social — Layout completo con Header global, Feed principal y Panel Comunidad
// Incluye: Historias Locales (con +), Feed con Create Post, Panel lateral de Comunidad
// Mensajería accesible desde ícono en header (estilo Instagram DM)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ActivityIndicator, RefreshControl, useWindowDimensions,
    FlatList, TextInput, Platform, ScrollView, Modal, TouchableWithoutFeedback,
    Animated as RNAnimated, NativeScrollEvent, NativeSyntheticEvent, Pressable, Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Heart, MessageCircle, Share2, MoreHorizontal, Search, Plus, Send,
    ImageIcon, Tag, MapPin, Bookmark, Calendar, TrendingUp, UserPlus,
    CheckCircle, Bell, ShoppingCart, X, Edit3, Trash2, Link, Flag, EyeOff
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { useSocialStore, Post } from '../../stores/socialStore';
import { useChatStore, ChatRoom } from '../../stores/chatStore';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { CreatePostModal, SharedBusinessCard, SharedServiceCard, SharedAccommodationCard } from '../../components/social';
import { CreateStoryModal } from '../../components/home';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../components/ui/AppHeader';
import { setOpenCreatePostFn } from './_layout';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useThemeColors } from '../../hooks/useThemeColors';
import { supabase } from '../../lib/supabase';
import { showAlert } from '../../utils/alert';
import { glassStyle } from '../../utils/glass';

// =============================================
// MENÚ DE OPCIONES DE UN POST (Bottom Sheet)
// =============================================
function PostOptionsMenu({ post, visible, onClose, tc, userId, onDelete, onEdit }: {
    post: Post | null;
    visible: boolean;
    onClose: () => void;
    tc: ReturnType<typeof useThemeColors>;
    userId?: string;
    onDelete: (postId: string) => void;
    onEdit: (post: Post) => void;
}) {
    if (!post || !visible) return null;

    const isOwner = userId && post.author_id === userId;

    const handleCopyLink = async () => {
        try {
            const link = `unpique://post/${post.id}`;
            if (Platform.OS === 'web' && navigator?.clipboard) {
                await navigator.clipboard.writeText(link);
            }
            showAlert('Copiado', 'Enlace copiado al portapapeles.');
        } catch {
            showAlert('Error', 'No se pudo copiar el enlace.');
        }
        onClose();
    };

    const handleDelete = () => {
        const doDelete = () => {
            onDelete(post.id);
            onClose();
        };

        if (Platform.OS === 'web') {
            const ok = window.confirm('¿Estás seguro de que querés eliminar esta publicación? Esta acción no se puede deshacer.');
            if (ok) doDelete();
        } else {
            Alert.alert(
                'Eliminar publicación',
                '¿Estás seguro? Esta acción no se puede deshacer.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    const handleEdit = () => {
        onEdit(post);
        onClose();
    };

    const handleReport = () => {
        showAlert('Gracias', 'Gracias por reportar. Revisaremos esta publicación.');
        onClose();
    };

    const handleHide = () => {
        showAlert('Preferencia guardada', 'Verás menos contenido como este.');
        onClose();
    };

    const MenuOption = ({ icon, label, onPress, destructive }: { icon: React.ReactNode; label: string; onPress: () => void; destructive?: boolean }) => (
        <TouchableOpacity style={menuStyles.option} onPress={onPress} activeOpacity={0.6}>
            {icon}
            <Text style={[menuStyles.optionText, { color: destructive ? '#ef4444' : tc.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={menuStyles.overlay}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={[menuStyles.panel, { backgroundColor: tc.bgCard }]}>
                            <View style={menuStyles.handle} />

                            {isOwner ? (
                                <>
                                    <MenuOption icon={<Edit3 size={20} color={tc.text} />} label="Editar publicación" onPress={handleEdit} />
                                    <View style={[menuStyles.divider, { backgroundColor: tc.borderLight }]} />
                                    <MenuOption icon={<Trash2 size={20} color="#ef4444" />} label="Eliminar publicación" onPress={handleDelete} destructive />
                                    <View style={[menuStyles.divider, { backgroundColor: tc.borderLight }]} />
                                    <MenuOption icon={<Link size={20} color={tc.text} />} label="Copiar enlace" onPress={handleCopyLink} />
                                </>
                            ) : (
                                <>
                                    <MenuOption icon={<Flag size={20} color={tc.text} />} label="Reportar publicación" onPress={handleReport} />
                                    <View style={[menuStyles.divider, { backgroundColor: tc.borderLight }]} />
                                    <MenuOption icon={<Link size={20} color={tc.text} />} label="Copiar enlace" onPress={handleCopyLink} />
                                    <View style={[menuStyles.divider, { backgroundColor: tc.borderLight }]} />
                                    <MenuOption icon={<EyeOff size={20} color={tc.text} />} label="Dejar de ver este tipo de contenido" onPress={handleHide} />
                                </>
                            )}

                            <View style={[menuStyles.dividerThick, { backgroundColor: tc.borderLight }]} />
                            <MenuOption icon={<X size={20} color={tc.textMuted} />} label="Cancelar" onPress={onClose} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const menuStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    panel: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 34 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 16 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    optionText: { fontSize: 16, fontWeight: '500' },
    divider: { height: 0.5, width: '100%' },
    dividerThick: { height: 6, width: '100%', marginVertical: 4, borderRadius: 3 },
});

// =============================================
// COMPONENTE PRINCIPAL — SocialScreen
// =============================================
export default function SocialScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [dmDrawerVisible, setDmDrawerVisible] = useState(false);
    const scrollY = useRef(new RNAnimated.Value(0)).current;

    // Responsive: panel derecho visible solo en desktop (>= 1024px)
    const isDesktop = width >= 1024;

    // Shadow opacity interpolated from scroll offset
    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* ================================================
                HEADER UNIVERSAL — Buscador, Notificaciones, Carrito
               ================================================ */}
            <AppHeader
                subtitle="CONECTA"
                title="Social"
                leftIcon="menu"
                rightButtons={['search', 'messages', 'notifications', 'cart']}
                onSearchSubmit={(text) => router.push(`/search?q=${encodeURIComponent(text)}` as any)}
                scrollY={scrollY}
            />

            {/* ================================================
                CONTENIDO PRINCIPAL — Feed (2/3) + Comunidad (1/3)
               ================================================ */}
            <View style={styles.mainLayout}>
                {/* Columna Central — Feed (ocupa mayor parte) */}
                <View style={styles.feedColumn}>
                    <FeedSection tc={tc} isDesktop={isDesktop} scrollY={scrollY} />
                </View>

                {/* Panel Derecho — Comunidad (solo en desktop, 1/3) */}
                {isDesktop && (
                    <ScrollView
                        style={[styles.communityPanel, { borderLeftColor: tc.borderLight }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <CommunityPanel tc={tc} />
                    </ScrollView>
                )}
            </View>

            {/* ================================================
                MODAL DE MENSAJERÍA DIRECTA (estilo Instagram DM)
               ================================================ */}
            <DMDrawer
                visible={dmDrawerVisible}
                onClose={() => setDmDrawerVisible(false)}
                tc={tc}
            />
        </SafeAreaView>
    );
}


// =============================================
// DRAWER DE MENSAJERÍA DIRECTA (estilo Instagram)
// =============================================
function DMDrawer({ visible, onClose, tc }: { visible: boolean; onClose: () => void; tc: ReturnType<typeof useThemeColors> }) {
    const { rooms, loading: loadingChats, fetchRooms } = useChatStore();
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (visible && user) {
            // Solo fetchRooms — al terminar ya actualiza el unreadCount global (Cambio 1)
            fetchRooms(user.id);
        }
    }, [visible, user]);

    const handleChatPress = (roomId: string) => {
        // NO cerrar el drawer antes de navegar
        // Cuando el usuario vuelve con router.back(), el drawer sigue montado y visible
        router.push(`/chat/${roomId}` as any);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.dmOverlay}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={[styles.dmContainer, { backgroundColor: tc.bgCard }]}>
                            {/* Cabecera del drawer */}
                            <View style={[styles.dmHeader, { borderBottomColor: tc.borderLight }]}>
                                <Text style={[styles.dmTitle, { color: tc.text }]}>Mensajes</Text>
                                <TouchableOpacity onPress={onClose} style={styles.dmCloseBtn}>
                                    <X size={22} color={tc.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Barra de búsqueda de chats */}
                            <View style={[styles.dmSearchBar, { backgroundColor: tc.bgInput, marginHorizontal: 16, marginVertical: 12 }]}>
                                <Search size={16} color={tc.textMuted} />
                                <Text style={[styles.dmSearchPlaceholder, { color: tc.textMuted }]}>Buscar conversaciones...</Text>
                            </View>

                            {/* Lista de chats */}
                            {loadingChats ? (
                                <View style={{ padding: 16, gap: 12 }}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.3 + (i * 0.1) }}>
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tc.borderLight }} />
                                            <View style={{ flex: 1, gap: 8 }}>
                                                <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: tc.borderLight }} />
                                                <View style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: tc.borderLight }} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : rooms.length > 0 ? (
                                <ScrollView style={{ flex: 1 }}>
                                    {rooms.map((room: ChatRoom) => (
                                        <TouchableOpacity
                                            key={room.id}
                                            style={[styles.dmChatItem, { borderBottomColor: tc.borderLight }]}
                                            onPress={() => handleChatPress(room.id)}
                                        >
                                            <Image
                                                source={{ uri: room.other_user?.avatar_url || 'https://via.placeholder.com/44' }}
                                                style={styles.dmChatAvatar}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.dmChatName, { color: tc.text }]}>
                                                    {room.other_user?.full_name || 'Usuario'}
                                                </Text>
                                                <Text style={[styles.dmChatMsg, { color: tc.textMuted }]} numberOfLines={1}>
                                                    {room.last_message || 'Enviar un mensaje...'}
                                                </Text>
                                            </View>
                                            {(room.unread_count || 0) > 0 && (
                                                <View style={styles.dmUnread}>
                                                    <Text style={styles.dmUnreadText}>{room.unread_count}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <MessageCircle size={40} color={tc.textMuted} />
                                    <Text style={[styles.dmEmptyText, { color: tc.textMuted }]}>
                                        No tenés mensajes aún
                                    </Text>
                                    <Text style={[styles.dmEmptySub, { color: tc.textMuted }]}>
                                        Los chats con negocios y usuarios aparecerán acá.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// =============================================
// HISTORIAS LOCALES — Con botón "+" para agregar
// =============================================
function LocalStories({ tc, onAddStory }: { tc: ReturnType<typeof useThemeColors>; onAddStory: () => void }) {
    const { user } = useAuthStore();

    const handleAddStory = () => {
        onAddStory();
    };

    return (
        <View style={styles.storiesSection}>
            <Text style={[styles.storiesTitle, { color: tc.text }]}>Historias Locales</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {/* Botón "+" para agregar una historia nueva */}
                <TouchableOpacity style={styles.storyItem} activeOpacity={0.7} onPress={handleAddStory}>
                    <View style={[styles.storyAvatarRing, { borderColor: tc.borderLight, borderStyle: 'dashed' }]}>
                        <View style={[styles.addStoryCircle, { backgroundColor: tc.bgInput }]}>
                            {user?.user_metadata?.avatar_url ? (
                                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.storyAvatar} />
                            ) : (
                                <Plus size={24} color={colors.primary.DEFAULT} />
                            )}
                        </View>
                        <View style={[styles.addStoryBadge, { backgroundColor: colors.primary.DEFAULT }]}>
                            <Plus size={10} color="#fff" />
                        </View>
                    </View>
                    <Text style={[styles.storyName, { color: tc.textSecondary }]}>Tu historia</Text>
                </TouchableOpacity>

                {/* Placeholder — las historias reales se integrarán en el futuro */}
                <View style={[styles.storyItem, { opacity: 0.5 }]}>
                    <View style={[styles.storyAvatarRing, { borderColor: tc.borderLight }]}>
                        <View style={[styles.addStoryCircle, { backgroundColor: tc.bgInput }]}>
                            <Calendar size={20} color={tc.textMuted} />
                        </View>
                    </View>
                    <Text style={[styles.storyName, { color: tc.textMuted }]} numberOfLines={1}>Pronto...</Text>
                </View>
            </ScrollView>
        </View>
    );
}

// =============================================
// CREATE POST BOX — Con acciones (Imagen, Etiquetar, Ubicación, Publicar)
// =============================================
function CreatePostBox({ tc, onPress }: { tc: ReturnType<typeof useThemeColors>; onPress: () => void }) {
    const { user } = useAuthStore();

    return (
        <View style={[styles.createPostCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            <View style={styles.createPostRow}>
                <Image
                    source={{ uri: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop' }}
                    style={styles.createAvatar}
                />
                <TouchableOpacity
                    style={[styles.createInput, { backgroundColor: tc.bgInput }]}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.createPlaceholder, { color: tc.textMuted }]}>
                        ¿Qué estás pensando?
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.createActionsBar, { borderTopColor: tc.borderLight }]}>
                <TouchableOpacity style={styles.createAction} onPress={onPress}>
                    <ImageIcon size={16} color="#22c55e" />
                    <Text style={[styles.createActionText, { color: tc.textSecondary }]}>Imagen/Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createAction} onPress={onPress}>
                    <Tag size={16} color="#3b82f6" />
                    <Text style={[styles.createActionText, { color: tc.textSecondary }]}>Etiquetar Comercio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createAction} onPress={onPress}>
                    <MapPin size={16} color="#ef4444" />
                    <Text style={[styles.createActionText, { color: tc.textSecondary }]}>Ubicación</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    style={[styles.publishBtn, { backgroundColor: colors.primary.DEFAULT }]}
                    onPress={onPress}
                >
                    <Text style={styles.publishBtnText}>Publicar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// =============================================
// COMENTARIOS EN LÍNEA — 2-step query (sin embedded join)
// =============================================
function InlineComments({ postId, tc, visible }: { postId: string; tc: ReturnType<typeof useThemeColors>; visible: boolean }) {
    const { user } = useAuthStore();
    const { profile } = useAuthStore();
    const [comments, setComments] = useState<any[]>([]);
    const [repliesMap, setRepliesMap] = useState<Record<string, any[]>>({});
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [commentLikes, setCommentLikes] = useState<Set<string>>(new Set());
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
                .select(`
                  id,
                  content,
                  created_at,
                  user_id,
                  parent_comment_id,
                  likes_count
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[Comments] error:', error);
                setLoading(false);
                return;
            }

            // Fetch de usuarios por separado
            const userIds = [...new Set((data || []).map(c => c.user_id))];
            
            let usersMap: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);
                
                (usersData || []).forEach(u => { usersMap[u.id] = u; });
            }

            // Combinar comentarios con datos de usuario
            const commentsWithUsers = (data || []).map(c => ({
                ...c,
                users: usersMap[c.user_id] || { id: c.user_id, full_name: 'Usuario', avatar_url: null }
            }));

            // Separar raíz vs replies
            const rootComments = commentsWithUsers.filter(c => 
                c.parent_comment_id === null || c.parent_comment_id === undefined
            );
            const rMap: Record<string, any[]> = {};
            commentsWithUsers.filter(c => c.parent_comment_id).forEach(c => {
                if (!rMap[c.parent_comment_id]) rMap[c.parent_comment_id] = [];
                rMap[c.parent_comment_id].push(c);
            });

            setComments(rootComments);
            setRepliesMap(rMap);
        } catch (err) {
            console.error('Error al obtener comentarios:', err);
        }
        setLoading(false);
    };

    const handleLikeComment = async (commentId: string) => {
        if (!user) return;
        
        const { data, error } = await supabase.rpc('toggle_comment_like', {
            p_comment_id: commentId,
            p_user_id: user.id,
        });
        
        if (!error && data) {
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, likes_count: data.likes_count } : c
            ));
            setRepliesMap(prev => {
                const nextMap = { ...prev };
                for (const parent in nextMap) {
                    nextMap[parent] = nextMap[parent].map(c => 
                        c.id === commentId ? { ...c, likes_count: data.likes_count } : c
                    );
                }
                return nextMap;
            });
            setCommentLikes(prev => {
                const next = new Set(prev);
                data.liked ? next.add(commentId) : next.delete(commentId);
                return next;
            });
        }
    };

    const handleSend = async () => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para comentar.');
            return;
        }
        if (!newComment.trim() || !postId) return;
        setSending(true);
        try {
            const payload: any = {
                post_id: postId,
                user_id: user.id,
                content: newComment.trim(),
            };
            if (replyingTo) {
                payload.parent_comment_id = replyingTo.id;
            }

            const { error } = await supabase.from('post_comments').insert(payload);
            if (error) throw error;
            
            setNewComment('');
            setReplyingTo(null);
            fetchComments();
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
                                <View key={c.id} style={{ marginBottom: 12 }}>
                                    {/* Root Comment Row */}
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        <Image source={{ uri: c.users?.avatar_url || 'https://via.placeholder.com/30' }} style={[styles.commentAvatar, { backgroundColor: tc.bgInput }]} />
                                        <View style={{ flex: 1 }}>
                                            <View style={[styles.commentBubble, { backgroundColor: tc.bgHover }]}>
                                                <Text style={[styles.commentUser, { color: tc.text }]}>{c.users?.full_name || 'Usuario'}</Text>
                                                <Text style={[styles.commentText, { color: tc.textSecondary }]}>{c.content}</Text>
                                            </View>
                                            {/* Acciones y Tiempo */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, marginLeft: 4 }}>
                                                <Text style={[styles.commentTime, { color: tc.textMuted }]}>
                                                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: false, locale: es })}
                                                </Text>
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                                    onPress={() => handleLikeComment(c.id)}
                                                >
                                                    <Heart
                                                        size={13}
                                                        color={commentLikes.has(c.id) ? '#ef4444' : tc.textMuted}
                                                        fill={commentLikes.has(c.id) ? '#ef4444' : 'transparent'}
                                                    />
                                                    {(c.likes_count || 0) > 0 && (
                                                        <Text style={{ fontSize: 12, color: tc.textMuted }}>{c.likes_count}</Text>
                                                    )}
                                                </TouchableOpacity>

                                                <TouchableOpacity onPress={() => setReplyingTo({ id: c.id, name: c.users?.full_name || 'Usuario' })}>
                                                    <Text style={{ fontSize: 12, color: tc.textMuted, fontWeight: '500' }}>Responder</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Replies */}
                                    {repliesMap[c.id]?.map(reply => (
                                        <View key={reply.id} style={{ flexDirection: 'row', marginTop: 8, paddingLeft: 44, alignItems: 'flex-start' }}>
                                            <Image
                                                source={{ uri: reply.users?.avatar_url || 'https://via.placeholder.com/30' }}
                                                style={[styles.commentAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: tc.bgInput }]}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <View style={[styles.commentBubble, { backgroundColor: tc.bgHover, padding: 8, borderRadius: 12 }]}>
                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: tc.text }}>
                                                        {reply.users?.full_name || 'Usuario'}
                                                    </Text>
                                                    <Text style={{ fontSize: 13, color: tc.text }}>{reply.content}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, marginLeft: 4 }}>
                                                    <Text style={[styles.commentTime, { color: tc.textMuted }]}>
                                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: false, locale: es })}
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                                        onPress={() => handleLikeComment(reply.id)}
                                                    >
                                                        <Heart
                                                            size={13}
                                                            color={commentLikes.has(reply.id) ? '#ef4444' : tc.textMuted}
                                                            fill={commentLikes.has(reply.id) ? '#ef4444' : 'transparent'}
                                                        />
                                                        {(reply.likes_count || 0) > 0 && (
                                                            <Text style={{ fontSize: 12, color: tc.textMuted }}>{reply.likes_count}</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => setReplyingTo({ id: c.id, name: reply.users?.full_name || 'Usuario' })}>
                                                        <Text style={{ fontSize: 12, color: tc.textMuted, fontWeight: '500' }}>Responder</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.noComments, { color: tc.textMuted }]}>Sé el primero en comentar</Text>
                    )}

                    <View style={{ marginTop: 8 }}>
                        {replyingTo && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                paddingHorizontal: 12, paddingVertical: 6,
                                backgroundColor: 'rgba(255,107,53,0.1)',
                                borderTopLeftRadius: 8, borderTopRightRadius: 8,
                            }}>
                                <Text style={{ fontSize: 12, color: '#FF6B35' }}>
                                    Respondiendo a {replyingTo.name}
                                </Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                    <X size={14} color='#FF6B35' />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={[styles.commentInputRow, { borderTopColor: tc.borderLight }]}>
                            <Image source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/30' }} style={[styles.commentAvatar, { backgroundColor: tc.bgInput }]} />
                            <TextInput
                                style={[styles.commentInput, { backgroundColor: tc.bgInput, color: tc.text }]}
                                placeholder="Escribí un comentario..."
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
                    </View>
                </>
            )}
        </View>
    );
}

// =============================================
// FEED SECTION — Historias + Create Post + Posts
// =============================================
function FeedSection({ tc, isDesktop, scrollY }: { tc: ReturnType<typeof useThemeColors>; isDesktop: boolean; scrollY: RNAnimated.Value }) {
    const { posts, loading, fetchPosts, toggleLike, isLiked } = useSocialStore();
    const { user } = useAuthStore();
    const { currentLocality } = useLocationStore();
    const [refreshing, setRefreshing] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [showCreateStory, setShowCreateStory] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [repostTarget, setRepostTarget] = useState<Post | null>(null);

    // Post options menu state
    const [menuPost, setMenuPost] = useState<Post | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    // Edit post state
    const [editPost, setEditPost] = useState<Post | null>(null);

    const { width } = useWindowDimensions();

    // Registrar el handler del modal para que el tab bar pueda abrirlo
    useEffect(() => {
      setOpenCreatePostFn(() => {
        setEditPost(null);
        setCreateModalVisible(true);
      });
      // Limpiar al desmontar — el layout sabrá que no hay handler disponible
      return () => setOpenCreatePostFn(null);
    }, []);

    useEffect(() => {
        if (currentLocality) fetchPosts(currentLocality.id);
    }, [currentLocality]);

    const onRefresh = async () => {
        if (currentLocality) {
            setRefreshing(true);
            await fetchPosts(currentLocality.id);
            setRefreshing(false);
        }
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });
    };

    const handleShowMenu = (post: Post) => {
        setMenuPost(post);
        setMenuVisible(true);
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            showAlert('Eliminado', 'La publicación fue eliminada.');
            if (currentLocality) fetchPosts(currentLocality.id);
        } catch {
            showAlert('Error', 'No se pudo eliminar la publicación.');
        }
    };

    const handleEditPost = (post: Post) => {
        setEditPost(post);
        setCreateModalVisible(true);
    };

    const handleCloseCreateModal = () => {
        setCreateModalVisible(false);
        setEditPost(null);
        if (currentLocality) fetchPosts(currentLocality.id);
    };

    const handleScroll = RNAnimated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <PostCard item={item} tc={tc} isDesktop={isDesktop} toggleLike={toggleLike} isLiked={isLiked} toggleComments={toggleComments} expandedComments={expandedComments} currentLocality={currentLocality} onRepost={setRepostTarget} onShowMenu={handleShowMenu} />
        );
    }, [tc, isDesktop, expandedComments, currentLocality]);

    const keyExtractor = useCallback((item: Post) => item.id, []);

    return (
        <View style={{ flex: 1 }}>
            <RNAnimated.FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                ItemSeparatorComponent={() => (
                    <View style={{ height: 8, backgroundColor: 'rgba(128,128,128,0.15)' }} />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.DEFAULT]} tintColor={colors.primary.DEFAULT} />
                }
                ListHeaderComponent={
                    <View>
                        <LocalStories tc={tc} onAddStory={() => setShowCreateStory(true)} />
                        <CreatePostBox tc={tc} onPress={() => { setEditPost(null); setCreateModalVisible(true); }} />
                    </View>
                }
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No hay publicaciones aún</Text>
                        <Text style={[styles.emptySubtext, { color: tc.textMuted }]}>¡Sé el primero en publicar!</Text>
                    </View>
                ) : (
                    <View style={{ padding: 40 }}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
                )}
            />

            {/* FAB — solo en desktop; en mobile el "+" está en el tab bar */}
            {width >= 768 && (
              <Pressable
                  style={({ pressed }) => [
                      styles.fab,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.93 }] },
                  ]}
                  onPress={() => { setEditPost(null); setCreateModalVisible(true); }}
              >
                  <Plus size={22} color={colors.white} strokeWidth={2.5} />
              </Pressable>
            )}

            <CreatePostModal visible={createModalVisible} onClose={handleCloseCreateModal} editPost={editPost} />
            <CreateStoryModal visible={showCreateStory} onClose={() => setShowCreateStory(false)} />
            <RepostModal post={repostTarget} onClose={() => setRepostTarget(null)} tc={tc} />
            <PostOptionsMenu
                post={menuPost}
                visible={menuVisible}
                onClose={() => { setMenuVisible(false); setMenuPost(null); }}
                tc={tc}
                userId={user?.id}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
            />
        </View>
    );
}

// =============================================
// MODAL DE REPOST (Compartir en mi muro, estilo Facebook)
// =============================================
function RepostModal({ post, onClose, tc }: { post: Post | null; onClose: () => void; tc: ReturnType<typeof useThemeColors> }) {
    const { user } = useAuthStore();
    const { profile } = useAuthStore();
    const { createPost } = useSocialStore();
    const { currentLocality } = useLocationStore();
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);

    if (!post) return null;

    const handleRepost = async () => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para compartir.');
            return;
        }
        setSending(true);
        try {
            // Build repost content — user comment + quoted original
            const userComment = comment.trim() ? `${comment.trim()}\n\n` : '';
            const repostContent = `${userComment}🔄 Compartido de ${post.author.full_name}:\n"${post.content}"`;
            await createPost(repostContent, post.media_urls || [], currentLocality?.id || post.locality_id || '');
            showAlert('¡Compartido!', 'La publicación se compartió en tu muro.');
            setComment('');
            onClose();
        } catch (error) {
            showAlert('Error', 'No se pudo compartir la publicación.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal visible={!!post} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.repostOverlay}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={[styles.repostContainer, { backgroundColor: tc.bgCard }]}>
                            {/* Header */}
                            <View style={[styles.repostHeader, { borderBottomColor: tc.borderLight }]}>
                                <Text style={[styles.repostTitle, { color: tc.text }]}>Compartir en tu muro</Text>
                                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                    <X size={22} color={tc.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                                {/* User comment input */}
                                <View style={styles.repostCommentSection}>
                                    <Image source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/36' }} style={styles.repostUserAvatar} />
                                    <TextInput
                                        style={[styles.repostInput, { color: tc.text }]}
                                        placeholder="Decí algo sobre esta publicación..."
                                        placeholderTextColor={tc.textMuted}
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        maxLength={500}
                                        autoFocus
                                    />
                                </View>

                                {/* Original post preview */}
                                <View style={[styles.repostPreview, { borderColor: tc.borderLight, backgroundColor: tc.bgSecondary }]}>
                                    <View style={styles.repostPreviewHeader}>
                                        <Image source={{ uri: post.author.avatar_url || 'https://via.placeholder.com/30' }} style={styles.repostPreviewAvatar} />
                                        <View>
                                            <Text style={[styles.repostPreviewName, { color: tc.text }]}>{post.author.full_name}</Text>
                                            <Text style={[styles.repostPreviewTime, { color: tc.textMuted }]}>
                                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.repostPreviewContent, { color: tc.textSecondary }]} numberOfLines={4}>{post.content}</Text>
                                    {post.media_urls && post.media_urls.length > 0 && (
                                        <Image source={{ uri: post.media_urls[0] }} style={styles.repostPreviewImage} resizeMode="cover" />
                                    )}
                                </View>
                            </ScrollView>

                            {/* Submit button */}
                            <View style={[styles.repostFooter, { borderTopColor: tc.borderLight }]}>
                                <TouchableOpacity
                                    style={[styles.repostBtn, { opacity: sending ? 0.6 : 1 }]}
                                    onPress={handleRepost}
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.repostBtnText}>Compartir ahora</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// =============================================
// POST CARD — Con repost y guardado con feedback
// =============================================
function PostCard({ item, tc, isDesktop, toggleLike, isLiked, toggleComments, expandedComments, currentLocality, onRepost, onShowMenu }: any) {
    const { isSaved, toggleSave } = useSocialStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const liked = isLiked(item.id);
    const saved = isSaved(item.id);
    const commentsOpen = expandedComments.has(item.id);
    const [saveFlash, setSaveFlash] = useState(false);
    const { width } = useWindowDimensions();
    const showActionText = width >= 768;
    const isMobile = width < 768;

    const handleSave = () => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para guardar.');
            return;
        }
        const wasSaved = isSaved(item.id);
        toggleSave(item.id);
        if (!wasSaved) {
            setSaveFlash(true);
            setTimeout(() => setSaveFlash(false), 2000);
        }
    };

    const handleShare = () => {
        if (!user) {
            showAlert('Acción requerida', 'Debes iniciar sesión para compartir.');
            return;
        }
        onRepost?.(item);
    };

    const parseContent = (content: string) => {
        let text = content;
        let service = null;
        let business = null;
        let accommodation = null;

        const serviceMatch = /\[service:([^:\]]+):([^\]]+)\]/.exec(text);
        if (serviceMatch) {
            text = text.replace(serviceMatch[0], '').trim();
            service = { id: serviceMatch[1], name: serviceMatch[2] };
        }

        const businessMatch = /\[business:([^:\]]+):([^\]]+)\]/.exec(text);
        if (businessMatch) {
            text = text.replace(businessMatch[0], '').trim();
            business = { id: businessMatch[1], name: businessMatch[2] };
        }

        const accommodationMatch = /\[accommodation:([^:\]]+):([^\]]+)\]/.exec(text);
        if (accommodationMatch) {
            text = text.replace(accommodationMatch[0], '').trim();
            accommodation = { id: accommodationMatch[1], name: accommodationMatch[2] };
        }

        return { text, service, business, accommodation };
    };

    const parsed = parseContent(item.content);

    return (
        <View style={[
            styles.postCard, 
            { backgroundColor: tc.bgCard },
            isMobile ? {
                borderWidth: 0,
                borderRadius: 0,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: tc.borderLight,
                marginHorizontal: 0,
                marginBottom: 0,
            } : {
                borderColor: tc.borderLight,
            }
        ]}>
            {/* Cabecera — Avatar + Nombre + Hora + Ubicación */}
            <View style={styles.postHeader}>
                <Pressable style={[styles.userInfo, Platform.OS === 'web' && { cursor: 'pointer' } as any]} onPress={() => router.push(`/profile/${item.author_id}` as any)}>
                    {item.author?.avatar_url ? (
                        <Image source={{ uri: item.author.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary.DEFAULT, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 18 }}>
                                {item.author?.full_name ? item.author.full_name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
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
                </Pressable>
                <Pressable style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]} hitSlop={8} onPress={() => onShowMenu?.(item)}>
                    <MoreHorizontal size={18} color={tc.textMuted} />
                </Pressable>
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
                            <SharedServiceCard serviceId={parsed.service.id} serviceName={parsed.service.name} tc={tc} router={router} />
                        )}
                        {parsed.business && (
                            <SharedBusinessCard businessId={parsed.business.id} businessName={parsed.business.name} tc={tc} router={router} />
                        )}
                        {parsed.accommodation && (
                            <SharedAccommodationCard accommodationId={parsed.accommodation.id} accommodationName={parsed.accommodation.name} tc={tc} router={router} />
                        )}
                    </View>
                </View>
            ) : (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    {!!parsed.text && <Text style={[styles.caption, { color: tc.text, marginBottom: (parsed.service || parsed.business || parsed.accommodation) ? 8 : 0 }]}>{parsed.text}</Text>}
                    {parsed.service && (
                        <SharedServiceCard serviceId={parsed.service.id} serviceName={parsed.service.name} tc={tc} router={router} />
                    )}
                    {parsed.business && (
                        <SharedBusinessCard businessId={parsed.business.id} businessName={parsed.business.name} tc={tc} router={router} />
                    )}
                    {parsed.accommodation && (
                        <SharedAccommodationCard accommodationId={parsed.accommodation.id} accommodationName={parsed.accommodation.name} tc={tc} router={router} />
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
                    <Heart size={20} color={liked ? colors.danger : tc.textSecondary} fill={liked ? colors.danger : 'transparent'} />
                    {item.likes_count > 0 && (
                        <Text style={[styles.actionCount, { color: liked ? colors.danger : tc.textSecondary }]}>
                            {item.likes_count}
                        </Text>
                    )}
                    {showActionText && <Text style={[styles.actionText, { color: liked ? colors.danger : tc.textSecondary }]}>Me gusta</Text>}
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleComments(item.id)}>
                    <MessageCircle size={20} color={tc.textSecondary} />
                    {item.comments_count > 0 && (
                        <Text style={[styles.actionCount, { color: tc.textSecondary }]}>
                            {item.comments_count}
                        </Text>
                    )}
                    {showActionText && <Text style={[styles.actionText, { color: tc.textSecondary }]}>Comentar</Text>}
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={handleShare}>
                    <Share2 size={20} color={tc.textSecondary} />
                    {showActionText && <Text style={[styles.actionText, { color: tc.textSecondary }]}>Compartir</Text>}
                </Pressable>
                <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]} onPress={handleSave}>
                    <Bookmark size={20} color={saved ? colors.primary.DEFAULT : tc.textSecondary} fill={saved ? colors.primary.DEFAULT : 'transparent'} />
                    {showActionText && <Text style={[styles.actionText, { color: saved ? colors.primary.DEFAULT : tc.textSecondary }]}>{saved ? 'Guardado' : 'Guardar'}</Text>}
                </Pressable>
            </View>

            {/* Flash de confirmación al guardar */}
            {saveFlash && (
                <View style={[styles.saveFlash, { backgroundColor: colors.primary.DEFAULT }]}>
                    <Bookmark size={14} color="#fff" fill="#fff" />
                    <Text style={styles.saveFlashText}>Guardado — lo encontrarás en tu perfil</Text>
                </View>
            )}

            <InlineComments postId={item.id} tc={tc} visible={commentsOpen} />
        </View>
    );
}

// =============================================
// PANEL DERECHO — "Comunidad"
// =============================================
function CommunityPanel({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
    const { currentLocality } = useLocationStore();
    const localityName = currentLocality?.name || 'tu localidad';

    return (
        <View style={styles.communityContent}>
            <Text style={[styles.communityTitle, { color: tc.text }]}>Comunidad</Text>

            {/* Tendencias */}
            <View style={[styles.communityCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <View style={styles.communityCardHeader}>
                    <TrendingUp size={16} color={colors.primary.DEFAULT} />
                    <Text style={[styles.communityCardTitle, { color: tc.text }]}>Tendencias en {localityName}</Text>
                </View>
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: tc.textMuted, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                        Disponible próximamente
                    </Text>
                </View>
            </View>

            {/* Sugerencias */}
            <View style={[styles.communityCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <View style={styles.communityCardHeader}>
                    <UserPlus size={16} color={'#3b82f6'} />
                    <Text style={[styles.communityCardTitle, { color: tc.text }]}>Sugerencias para vos</Text>
                </View>
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: tc.textMuted, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                        Disponible próximamente
                    </Text>
                </View>
            </View>

            {/* Próximos Eventos */}
            <View style={[styles.communityCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <View style={styles.communityCardHeader}>
                    <Calendar size={16} color={'#22c55e'} />
                    <Text style={[styles.communityCardTitle, { color: tc.text }]}>Próximos Eventos</Text>
                </View>
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: tc.textMuted, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                        Disponible próximamente
                    </Text>
                </View>
            </View>
        </View>
    );
}

// =============================================
// ESTILOS
// =============================================
const styles = StyleSheet.create({
    container: { flex: 1 },

    // — Header Social completo —
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 10,
    },
    headerShadowBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
            : { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerBrandIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(255,107,53,0.35)' } : {
            elevation: 4,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
        }),
    },
    headerBrandLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerBrandTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginTop: -1,
    },
    headerSearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 10,
        gap: 6,
        overflow: 'hidden',
    },
    headerSearchInput: {
        flex: 1,
        fontSize: 13,
        height: '100%',
        paddingVertical: 0,
        minWidth: 0,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    headerIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
    },

    // — Layout principal (Feed 2/3 + Comunidad 1/3) —
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },
    feedColumn: {
        flex: 2,
    },
    communityPanel: {
        flex: 1,
        maxWidth: 320,
        borderLeftWidth: 1,
    },
    communityContent: {
        padding: 20,
        gap: 20,
    },
    communityTitle: {
        fontSize: 18,
        fontWeight: '800',
    },

    // — Historias Locales —
    storiesSection: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    storiesTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 14,
    },
    storiesScroll: {
        gap: 14,
        paddingRight: 16,
    },
    storyItem: {
        alignItems: 'center',
        width: 64,
    },
    storyAvatarRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2.5,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    storyAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    storyName: {
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '500',
    },
    addStoryCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    addStoryBadge: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0a0a0a',
    },

    // — Create Post —
    createPostCard: {
        borderWidth: 1,
        borderRadius: 16,
        marginHorizontal: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    createPostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    createAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    createInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    createPlaceholder: { fontSize: 14 },
    createActionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        gap: 4,
        flexWrap: 'wrap',
    },
    createAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
    },
    createActionText: { fontSize: 12, fontWeight: '500' },
    publishBtn: {
        marginLeft: 'auto',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.25)' } : {
            elevation: 2,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
        }),
    },
    publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    // — Post Card — premium styling
    postCard: {
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 12,
        marginHorizontal: 12,
        ...(Platform.OS === 'web' ? { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } : {
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
        }),
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    userName: { fontWeight: '700', fontSize: 15 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    moreBtn: { padding: 4 },
    postContentWithImage: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingBottom: 12,
        gap: 14,
    },
    postImageSide: { width: 200, height: 200, borderRadius: 12 },
    caption: { fontSize: 14, lineHeight: 21, flex: 1 },
    sharedServiceCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
    sharedServiceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

    // — Counters —
    countsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
    },
    likeSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    likeIcon: {
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: colors.danger,
        justifyContent: 'center', alignItems: 'center',
    },
    countText: { fontSize: 13 },

    // — Action Bar — full hit-area, pill-shaped mini-buttons
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 2,
        borderBottomWidth: 0.5,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    actionCount: {
        fontSize: 13,
        fontWeight: '500',
    },
    actionText: { fontSize: 11, fontWeight: '600' },

    // — Comentarios —
    inlineComments: { borderTopWidth: 0.5, paddingBottom: 12 },
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

    // — Panel Comunidad (derecha) —
    communityCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    communityCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    communityCardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    trendingItem: { paddingVertical: 4 },
    trendingTag: { fontSize: 13 },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    suggestionAvatar: {
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 2, overflow: 'hidden',
    },
    suggestionAvatarImg: { width: '100%', height: '100%' },
    suggestionName: { fontSize: 13, fontWeight: '600' },
    suggestionSub: { fontSize: 11 },
    followBtn: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 999, borderWidth: 1.5,
    },
    followBtnText: { fontSize: 11, fontWeight: '700' },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    eventDate: {
        width: 48, height: 48, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    eventDay: { fontSize: 18, fontWeight: '800' },
    eventMonth: { fontSize: 11, fontWeight: '500', textTransform: 'lowercase' },
    eventTitle: { fontSize: 13, fontWeight: '600' },
    eventTime: { fontSize: 11 },

    // — DM Drawer (Mensajería) —
    dmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    dmContainer: {
        width: 360,
        height: '100%',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,

        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */



    },
    dmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    dmTitle: { fontSize: 20, fontWeight: '800' },
    dmCloseBtn: { padding: 4 },
    dmSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    dmSearchPlaceholder: { fontSize: 14 },
    dmChatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 0.5,
        gap: 12,
    },
    dmChatAvatar: { width: 44, height: 44, borderRadius: 22 },
    dmChatName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    dmChatMsg: { fontSize: 13 },
    dmUnread: {
        backgroundColor: colors.primary.DEFAULT,
        borderRadius: 10,
        minWidth: 20, height: 20,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 5,
    },
    dmUnreadText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    dmEmptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
    dmEmptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },

    // — Misceláneos —
    timeAgo: { fontSize: 12 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
    emptySubtext: { textAlign: 'center', fontSize: 14, marginTop: 8 },
    fab: {
        position: 'absolute', bottom: 20, right: 20,
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center', alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 6px 20px rgba(255,107,53,0.35)' } : {
            elevation: 8,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
        }),
    },

    // — Repost Modal —
    repostOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    repostContainer: { width: '90%', maxWidth: 520, borderRadius: 20, overflow: 'hidden' },
    repostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    repostTitle: { fontSize: 17, fontWeight: '700' },
    repostCommentSection: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'flex-start' },
    repostUserAvatar: { width: 36, height: 36, borderRadius: 18 },
    repostInput: { flex: 1, fontSize: 15, lineHeight: 20, minHeight: 50, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { outlineStyle: 'none', borderWidth: 0 } as any : {}) },
    repostPreview: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    repostPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
    repostPreviewAvatar: { width: 30, height: 30, borderRadius: 15 },
    repostPreviewName: { fontSize: 13, fontWeight: '700' },
    repostPreviewTime: { fontSize: 11 },
    repostPreviewContent: { fontSize: 13, lineHeight: 18, paddingHorizontal: 12, paddingBottom: 10 },
    repostPreviewImage: { width: '100%', height: 160 },
    repostFooter: { padding: 16, borderTopWidth: 1 },
    repostBtn: { backgroundColor: colors.primary.DEFAULT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    repostBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // — Save flash toast —
    saveFlash: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
    saveFlashText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
