import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Store, Briefcase, ChevronRight, Home } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore, Post } from '../../stores/socialStore';
import { showAlert } from '../../utils/alert';
import colors from '../../constants/colors';
import { useRouter } from 'expo-router';

const BUSINESS_CATEGORY_MAP: Record<string, string> = {
    restaurant: 'Restaurante', cafe: 'Café', bakery: 'Panadería',
    pharmacy: 'Farmacia', supermarket: 'Supermercado',
    minimarket: 'Minimercado', clothing: 'Ropa', shoes: 'Calzado',
    electronics: 'Electrónica', gym: 'Gimnasio',
    beauty_salon: 'Salón de Belleza', barbershop: 'Barbería',
    spa: 'Spa', auto_repair: 'Mecánica', auto_parts: 'Repuestos',
    health_clinic: 'Clínica', dentist: 'Odontología',
    veterinary: 'Veterinaria', laundry: 'Lavandería',
    hardware_store: 'Ferretería', bookstore: 'Librería',
    toys: 'Juguetería', pets: 'Mascotas', services: 'Servicios',
    furniture: 'Mueblería', other: 'Otros',
};

/* ═══════════════════════════════════════════════════════
   SharedBusinessCard – fetches real business data
   ═══════════════════════════════════════════════════════ */
export function SharedBusinessCard({ businessId, businessName, tc, router }: { businessId: string; businessName: string; tc: any; router: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                console.log('[SharedBusinessCard] fetching id:', businessId);
                const { data: biz, error } = await supabase
                    .from('businesses')
                    .select('id, name, logo_url, cover_url, category, rating, is_open, slug')
                    .eq('id', businessId)
                    .single();
                console.log('[SharedBusinessCard] result:', biz, error);
                if (!error && biz) setData(biz);
            } catch (_) { /* silent */ }
            setLoading(false);
        })();
    }, [businessId]);

    const handlePress = () => {
        if (data) {
            router.push(`/shop/${data.slug || data.id}` as any);
        } else {
            router.push(`/shop/${businessId}` as any);
        }
    };

    return (
        <View style={{ marginTop: 8 }}>
            <View style={sharedStyles.labelRow}>
                <Text style={{ fontSize: 16 }}>🏪</Text>
                <Text style={[sharedStyles.labelText, { color: tc.primary }]}>Local compartido</Text>
            </View>

            {loading ? (
                <View style={[sharedStyles.skeleton, { backgroundColor: tc.bgInput }]} />
            ) : !data ? (
                <TouchableOpacity style={[sharedStyles.fallbackCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress}>
                    <Store size={20} color={tc.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[sharedStyles.fallbackName, { color: tc.text }]}>{businessName}</Text>
                        <Text style={{ color: tc.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>Ver negocio →</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[sharedStyles.richCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress} activeOpacity={0.7}>
                    {data.logo_url ? (
                        <Image source={{ uri: data.logo_url }} style={sharedStyles.richImage} />
                    ) : (
                        <View style={[sharedStyles.richImage, sharedStyles.iconPlaceholder, { backgroundColor: tc.bgHover }]}>
                            <Store size={28} color={tc.textMuted} />
                        </View>
                    )}
                    <View style={sharedStyles.richContent}>
                        <Text style={[sharedStyles.richName, { color: tc.text }]} numberOfLines={1}>{data.name}</Text>
                        <Text style={[sharedStyles.richCategory, { color: tc.textSecondary }]} numberOfLines={1}>
                            {BUSINESS_CATEGORY_MAP[data.category] || data.category}
                        </Text>
                        <View style={sharedStyles.richFooter}>
                            <View style={[sharedStyles.openBadge, { backgroundColor: data.is_open ? '#22c55e' : '#ef4444' }]}>
                                <Text style={sharedStyles.openBadgeText}>{data.is_open ? 'Abierto' : 'Cerrado'}</Text>
                            </View>
                            {data.rating > 0 && (
                                <Text style={[sharedStyles.ratingText, { color: tc.text }]}>⭐ {Number(data.rating).toFixed(1)}</Text>
                            )}
                        </View>
                    </View>
                    <ChevronRight size={18} color={tc.textMuted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

/* ═══════════════════════════════════════════════════════
   SharedServiceCard – fetches real listing/service data
   ═══════════════════════════════════════════════════════ */
export function SharedServiceCard({ serviceId, serviceName, tc, router }: { serviceId: string; serviceName: string; tc: any; router: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data: svc, error } = await supabase
                    .from('listings')
                    .select('id, title, category, phone, rating, images, description')
                    .eq('id', serviceId)
                    .eq('type', 'service')
                    .single();
                if (!error && svc) setData(svc);
            } catch (_) { /* silent */ }
            setLoading(false);
        })();
    }, [serviceId]);

    const handlePress = () => {
        router.push(`/directory/${serviceId}` as any);
    };

    const firstImage = data?.images && data.images.length > 0 ? data.images[0] : null;

    return (
        <View style={{ marginTop: 8 }}>
            <View style={sharedStyles.labelRow}>
                <Text style={{ fontSize: 16 }}>🔧</Text>
                <Text style={[sharedStyles.labelText, { color: tc.primary }]}>Servicio compartido</Text>
            </View>

            {loading ? (
                <View style={[sharedStyles.skeleton, { backgroundColor: tc.bgInput }]} />
            ) : !data ? (
                <TouchableOpacity style={[sharedStyles.fallbackCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress}>
                    <Briefcase size={20} color={tc.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[sharedStyles.fallbackName, { color: tc.text }]}>{serviceName}</Text>
                        <Text style={{ color: tc.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>Ver servicio →</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[sharedStyles.richCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress} activeOpacity={0.7}>
                    {firstImage ? (
                        <Image source={{ uri: firstImage }} style={sharedStyles.richImage} />
                    ) : (
                        <View style={[sharedStyles.richImage, sharedStyles.iconPlaceholder, { backgroundColor: tc.bgHover }]}>
                            <Briefcase size={28} color={tc.textMuted} />
                        </View>
                    )}
                    <View style={sharedStyles.richContent}>
                        <Text style={[sharedStyles.richName, { color: tc.text }]} numberOfLines={1}>{data.title}</Text>
                        <Text style={[sharedStyles.richCategory, { color: tc.textSecondary }]} numberOfLines={1}>
                            {data.category || 'Servicio'}
                        </Text>
                        <View style={sharedStyles.richFooter}>
                            {data.rating > 0 && (
                                <Text style={[sharedStyles.ratingText, { color: tc.text }]}>⭐ {Number(data.rating).toFixed(1)}</Text>
                            )}
                        </View>
                    </View>
                    <ChevronRight size={18} color={tc.textMuted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

/* ═══════════════════════════════════════════════════════
   SharedAccommodationCard – fetches accommodation data
   ═══════════════════════════════════════════════════════ */
export function SharedAccommodationCard({ accommodationId, accommodationName, tc, router }: { accommodationId: string; accommodationName: string; tc: any; router: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data: acc, error } = await supabase
                    .from('listings')
                    .select('id, title, category, rating, images, description')
                    .eq('id', accommodationId)
                    .eq('type', 'accommodation')
                    .single();
                if (!error && acc) setData(acc);
            } catch (_) { /* silent */ }
            setLoading(false);
        })();
    }, [accommodationId]);

    const handlePress = () => {
        router.push(`/directory/${accommodationId}` as any);
    };

    const firstImage = data?.images && data.images.length > 0 ? data.images[0] : null;

    return (
        <View style={{ marginTop: 8 }}>
            <View style={sharedStyles.labelRow}>
                <Text style={{ fontSize: 16 }}>🏠</Text>
                <Text style={[sharedStyles.labelText, { color: tc.primary }]}>Alojamiento compartido</Text>
            </View>

            {loading ? (
                <View style={[sharedStyles.skeleton, { backgroundColor: tc.bgInput }]} />
            ) : !data ? (
                <TouchableOpacity style={[sharedStyles.fallbackCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress}>
                    <Home size={20} color={tc.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[sharedStyles.fallbackName, { color: tc.text }]}>{accommodationName}</Text>
                        <Text style={{ color: tc.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>Ver alojamiento →</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[sharedStyles.richCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handlePress} activeOpacity={0.7}>
                    {firstImage ? (
                        <Image source={{ uri: firstImage }} style={sharedStyles.richImage} />
                    ) : (
                        <View style={[sharedStyles.richImage, sharedStyles.iconPlaceholder, { backgroundColor: tc.bgHover }]}>
                            <Home size={28} color={tc.textMuted} />
                        </View>
                    )}
                    <View style={sharedStyles.richContent}>
                        <Text style={[sharedStyles.richName, { color: tc.text }]} numberOfLines={1}>{data.title}</Text>
                        <Text style={[sharedStyles.richCategory, { color: tc.textSecondary }]} numberOfLines={1}>
                            {data.category || 'Alojamiento'}
                        </Text>
                        <View style={sharedStyles.richFooter}>
                            {data.rating > 0 && (
                                <Text style={[sharedStyles.ratingText, { color: tc.text }]}>⭐ {Number(data.rating).toFixed(1)}</Text>
                            )}
                        </View>
                    </View>
                    <ChevronRight size={18} color={tc.textMuted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

/* Shared styles for the rich entity cards */
const sharedStyles = StyleSheet.create({
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    labelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    skeleton: { height: 64, borderRadius: 12, width: '100%' },
    fallbackCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
    fallbackName: { fontSize: 14, fontWeight: '700' },
    richCard: { flexDirection: 'row', alignItems: 'center', height: 80, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, overflow: 'hidden' },
    richImage: { width: 64, height: 64, borderRadius: 8 },
    iconPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    richContent: { flex: 1, marginLeft: 12, justifyContent: 'center', paddingVertical: 4 },
    richName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    richCategory: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
    richFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    openBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    openBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    ratingText: { fontSize: 12, fontWeight: '600' },
});

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
    const [missionClaim, setMissionClaim] = useState<any>(null);

    useEffect(() => {
        const fetchMission = async () => {
            try {
                const { data, error } = await supabase
                    .from('mission_claims')
                    .select('id, status, missions!inner(title, points_reward)')
                    .eq('post_id', item.id)
                    .single();
                
                if (data && !error) {
                    const missionData = Array.isArray(data.missions) ? data.missions[0] : data.missions;
                    setMissionClaim({
                        id: data.id,
                        status: data.status,
                        title: missionData?.title,
                        points: missionData?.points_reward
                    });
                }
            } catch (err) {
                // Ignore silent failure
            }
        };
        fetchMission();
    }, [item.id]);
    
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
        console.log('[parseContent] input:', content);
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

            {missionClaim && (
                <View style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)', padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.2)' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 13 }}>📸 Misión: {missionClaim.title}</Text>
                        <Text style={{ color: tc.textMuted, fontSize: 12, marginTop: 2 }}>+{missionClaim.points} pts</Text>
                    </View>
                    {missionClaim.status === 'approved' && (
                        <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>✓ Aprobada</Text>
                        </View>
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
});
