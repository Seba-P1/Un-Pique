// Vista de Perfil/Muro público — Diseño Facebook-like
// Responsive: mobile (single col) / tablet / desktop (2 col + sidebar)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, FlatList,
    ActivityIndicator, TouchableOpacity, Platform, useWindowDimensions,
    Pressable, TextInput, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, MapPin, Calendar, Camera, Edit3, UserPlus, MessageCircle,
    Heart, Share2, Bookmark, MoreHorizontal, Send, ImageIcon, Info,
    Grid3X3, BookmarkCheck, ChevronDown
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore, Post } from '../../stores/socialStore';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import colors from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../../utils/alert';

interface UserProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    banner_url?: string | null;
    bio?: string | null;
    created_at?: string;
    locality_name?: string;
}

type ProfileTab = 'posts' | 'info' | 'photos' | 'saved';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const tc = useThemeColors();
    const router = useRouter();
    const { user, profile: authProfile } = useAuthStore();
    const { fetchUserPosts, toggleLike, isLiked, isSaved, toggleSave, savedPosts, fetchSavedPosts } = useSocialStore();
    const { width } = useWindowDimensions();

    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [savedPostsList, setSavedPostsList] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

    const isOwnProfile = user?.id === id;
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Responsive dimensions
    const coverHeight = isMobile ? 200 : isTablet ? 260 : 350;
    const avatarSize = isMobile ? 100 : 130;
    const contentMaxWidth = 940;

    useEffect(() => {
        if (id) loadProfile();
    }, [id]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, full_name, avatar_url, created_at')
                .eq('id', id)
                .single();

            if (!error && userData) {
                setProfileData({
                    id: userData.id,
                    full_name: userData.full_name || 'Usuario',
                    avatar_url: userData.avatar_url,
                    created_at: userData.created_at,
                });
            }

            const userPosts = await fetchUserPosts(id!);
            setPosts(userPosts);

            // Load saved posts if own profile
            if (user?.id === id && savedPosts.length > 0) {
                const saved = await fetchSavedPosts(savedPosts);
                setSavedPostsList(saved);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    // Extract photos from posts
    const allPhotos = posts.reduce<string[]>((acc, p) => {
        if (p.media_urls && p.media_urls.length > 0) acc.push(...p.media_urls);
        return acc;
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                    <Text style={[styles.loadingText, { color: tc.textMuted }]}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!profileData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.floatingBack}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: tc.textMuted, fontSize: 16 }}>Usuario no encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    const tabs: { key: ProfileTab; label: string; icon: any }[] = [
        { key: 'posts', label: 'Publicaciones', icon: Grid3X3 },
        { key: 'info', label: 'Información', icon: Info },
        { key: 'photos', label: 'Fotos', icon: ImageIcon },
        ...(isOwnProfile ? [{ key: 'saved' as ProfileTab, label: 'Guardados', icon: BookmarkCheck }] : []),
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.DEFAULT]} tintColor={colors.primary.DEFAULT} />}
            >
                {/* ====== COVER PHOTO ====== */}
                <View style={[styles.coverContainer, { height: coverHeight }]}>
                    <LinearGradient
                        colors={[colors.primary.DEFAULT + '40', colors.primary.DEFAULT + '15', tc.bg]}
                        style={StyleSheet.absoluteFillObject}
                    />
                    {/* Back button overlay */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.coverBackBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>

                    {isOwnProfile && (
                        <TouchableOpacity style={[styles.editCoverBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                            <Camera size={16} color="#fff" />
                            <Text style={styles.editCoverText}>Editar portada</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ====== PROFILE INFO SECTION ====== */}
                <View style={[styles.profileSection, { maxWidth: isMobile ? undefined : contentMaxWidth, alignSelf: isMobile ? undefined : 'center', width: isMobile ? '100%' : '100%' }]}>
                    <View style={[styles.profileInfoRow, isMobile && styles.profileInfoRowMobile]}>
                        {/* Avatar */}
                        <View style={[styles.avatarWrapper, { marginTop: -(avatarSize / 2) }]}>
                            <Image
                                source={{ uri: profileData.avatar_url || 'https://via.placeholder.com/150' }}
                                style={[styles.profileAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: tc.bgCard }]}
                            />
                            {isOwnProfile && (
                                <TouchableOpacity
                                    style={[styles.editAvatarBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
                                    onPress={() => router.push('/edit-profile' as any)}
                                >
                                    <Camera size={16} color={tc.text} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Name + Meta */}
                        <View style={[styles.profileMeta, isMobile && styles.profileMetaMobile]}>
                            <Text style={[styles.profileName, { color: tc.text }]}>{profileData.full_name}</Text>
                            <View style={styles.metaRow}>
                                {profileData.created_at && (
                                    <View style={styles.metaItem}>
                                        <Calendar size={14} color={tc.textMuted} />
                                        <Text style={[styles.metaText, { color: tc.textMuted }]}>
                                            Se unió en {format(new Date(profileData.created_at), 'MMMM yyyy', { locale: es })}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.statsRow}>
                                <Text style={[styles.statNumber, { color: tc.text }]}>{posts.length}</Text>
                                <Text style={[styles.statLabel, { color: tc.textMuted }]}>publicaciones</Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={[styles.profileActions, isMobile && styles.profileActionsMobile]}>
                            {isOwnProfile ? (
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
                                    onPress={() => router.push('/edit-profile' as any)}
                                >
                                    <Edit3 size={16} color={tc.text} />
                                    <Text style={[styles.editBtnText, { color: tc.text }]}>Editar perfil</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.followBtn, { backgroundColor: colors.primary.DEFAULT }]}>
                                        <UserPlus size={16} color="#fff" />
                                        <Text style={styles.followBtnText}>Seguir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.messageBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                                        <MessageCircle size={16} color={tc.text} />
                                        <Text style={[styles.messageBtnText, { color: tc.text }]}>Mensaje</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* ====== TAB NAVIGATION ====== */}
                <View style={[styles.tabBar, { borderBottomColor: tc.borderLight, backgroundColor: 'transparent', maxWidth: isMobile ? undefined : contentMaxWidth, alignSelf: isMobile ? undefined : 'center', width: isMobile ? '100%' : '100%' }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                        {tabs.map((tab) => (
                            <Pressable
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                style={[
                                    styles.tabItem,
                                    activeTab === tab.key && styles.tabItemActive,
                                    activeTab === tab.key && { borderBottomColor: colors.primary.DEFAULT },
                                ]}
                            >
                                <tab.icon size={16} color={activeTab === tab.key ? colors.primary.DEFAULT : tc.textMuted} />
                                <Text style={[
                                    styles.tabLabel,
                                    { color: activeTab === tab.key ? colors.primary.DEFAULT : tc.textMuted },
                                    activeTab === tab.key && { fontWeight: '700' },
                                ]}>{tab.label}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* ====== TAB CONTENT ====== */}
                <View style={[styles.contentArea, { maxWidth: isMobile ? undefined : contentMaxWidth, alignSelf: isMobile ? undefined : 'center', width: isMobile ? '100%' : '100%' }]}>
                    {activeTab === 'posts' && (
                        <View style={[styles.twoColumnLayout, isMobile && { flexDirection: 'column' }]}>
                            {/* Sidebar — solo en desktop/tablet */}
                            {!isMobile && (
                                <View style={[styles.sidebar, isTablet && { width: 280 }]}>
                                    {/* Intro Card */}
                                    <View style={[styles.sidebarCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                        <Text style={[styles.sidebarCardTitle, { color: tc.text }]}>Intro</Text>
                                        <View style={styles.introItem}>
                                            <MapPin size={16} color={tc.textMuted} />
                                            <Text style={[styles.introText, { color: tc.textSecondary }]}>Vive en <Text style={{ fontWeight: '600', color: tc.text }}>Río Colorado</Text></Text>
                                        </View>
                                        {profileData.created_at && (
                                            <View style={styles.introItem}>
                                                <Calendar size={16} color={tc.textMuted} />
                                                <Text style={[styles.introText, { color: tc.textSecondary }]}>
                                                    Se unió en {format(new Date(profileData.created_at), 'MMMM yyyy', { locale: es })}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Photos Grid */}
                                    {allPhotos.length > 0 && (
                                        <View style={[styles.sidebarCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                            <View style={styles.sidebarCardHeaderRow}>
                                                <Text style={[styles.sidebarCardTitle, { color: tc.text }]}>Fotos</Text>
                                                <TouchableOpacity onPress={() => setActiveTab('photos')}>
                                                    <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: '600' }}>Ver todas</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.photosGrid}>
                                                {allPhotos.slice(0, 9).map((url, i) => (
                                                    <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Saved count (own profile) */}
                                    {isOwnProfile && savedPosts.length > 0 && (
                                        <TouchableOpacity
                                            style={[styles.sidebarCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                            onPress={() => setActiveTab('saved')}
                                        >
                                            <View style={styles.sidebarCardHeaderRow}>
                                                <Text style={[styles.sidebarCardTitle, { color: tc.text }]}>Guardados</Text>
                                                <Bookmark size={16} color={colors.primary.DEFAULT} fill={colors.primary.DEFAULT} />
                                            </View>
                                            <Text style={{ color: tc.textMuted, fontSize: 13 }}>{savedPosts.length} elementos guardados</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Feed Central */}
                            <View style={styles.feedColumn}>
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <WallPostCard key={post.id} post={post} tc={tc} isLiked={isLiked} toggleLike={toggleLike} isSaved={isSaved} toggleSave={toggleSave} router={router} />
                                    ))
                                ) : (
                                    <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                        <Grid3X3 size={40} color={tc.textMuted} />
                                        <Text style={[styles.emptyTitle, { color: tc.text }]}>
                                            {isOwnProfile ? 'No tenés publicaciones aún' : 'Sin publicaciones'}
                                        </Text>
                                        <Text style={[styles.emptySubtext, { color: tc.textMuted }]}>
                                            {isOwnProfile ? 'Compartí algo con la comunidad desde la sección Social' : 'Este usuario no ha publicado nada todavía'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'info' && (
                        <View style={[styles.infoCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <Text style={[styles.infoTitle, { color: tc.text }]}>Información</Text>
                            <View style={styles.infoRow}>
                                <MapPin size={18} color={tc.textMuted} />
                                <View>
                                    <Text style={[styles.infoLabel, { color: tc.textMuted }]}>Ciudad</Text>
                                    <Text style={[styles.infoValue, { color: tc.text }]}>Río Colorado, Río Negro</Text>
                                </View>
                            </View>
                            {profileData.created_at && (
                                <View style={styles.infoRow}>
                                    <Calendar size={18} color={tc.textMuted} />
                                    <View>
                                        <Text style={[styles.infoLabel, { color: tc.textMuted }]}>Miembro desde</Text>
                                        <Text style={[styles.infoValue, { color: tc.text }]}>{format(new Date(profileData.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'photos' && (
                        <View style={[styles.photosTabContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <Text style={[styles.infoTitle, { color: tc.text }]}>Fotos</Text>
                            {allPhotos.length > 0 ? (
                                <View style={styles.photosFullGrid}>
                                    {allPhotos.map((url, i) => (
                                        <Image key={i} source={{ uri: url }} style={[styles.photoFull, isMobile && { width: '48%' }]} />
                                    ))}
                                </View>
                            ) : (
                                <Text style={{ color: tc.textMuted, fontSize: 14, padding: 20, textAlign: 'center' }}>No hay fotos para mostrar</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'saved' && isOwnProfile && (
                        <View style={styles.feedColumn}>
                            {savedPostsList.length > 0 ? (
                                savedPostsList.map((post) => (
                                    <WallPostCard key={post.id} post={post} tc={tc} isLiked={isLiked} toggleLike={toggleLike} isSaved={isSaved} toggleSave={toggleSave} router={router} />
                                ))
                            ) : (
                                <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <Bookmark size={40} color={tc.textMuted} />
                                    <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin elementos guardados</Text>
                                    <Text style={[styles.emptySubtext, { color: tc.textMuted }]}>Los posts que guardes aparecerán acá</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Bottom spacer */}
                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// =============================================
// POST CARD para el muro (versión compacta Facebook)
// =============================================
function WallPostCard({ post, tc, isLiked, toggleLike, isSaved, toggleSave, router }: any) {
    const liked = isLiked(post.id);
    const saved = isSaved(post.id);

    return (
        <View style={[wallStyles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            {/* Header */}
            <View style={wallStyles.header}>
                <Pressable
                    style={[wallStyles.authorRow, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                    onPress={() => router.push(`/profile/${post.author_id}` as any)}
                >
                    <Image source={{ uri: post.author.avatar_url || 'https://via.placeholder.com/40' }} style={wallStyles.avatar} />
                    <View>
                        <Text style={[wallStyles.authorName, { color: tc.text }]}>{post.author.full_name}</Text>
                        <Text style={[wallStyles.postTime, { color: tc.textMuted }]}>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                        </Text>
                    </View>
                </Pressable>
                <TouchableOpacity style={{ padding: 4 }}>
                    <MoreHorizontal size={18} color={tc.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={[wallStyles.content, { color: tc.text }]}>{post.content}</Text>

            {/* Image */}
            {post.media_urls && post.media_urls.length > 0 && (
                <Image source={{ uri: post.media_urls[0] }} style={wallStyles.postImage} resizeMode="cover" />
            )}

            {/* Stats */}
            {(post.likes_count > 0 || post.comments_count > 0) && (
                <View style={[wallStyles.stats, { borderBottomColor: tc.borderLight }]}>
                    {post.likes_count > 0 && (
                        <View style={wallStyles.statItem}>
                            <View style={wallStyles.likeBadge}><Heart size={9} color="#fff" fill="#fff" /></View>
                            <Text style={[wallStyles.statText, { color: tc.textMuted }]}>
                                {liked ? (post.likes_count > 1 ? `Vos y ${post.likes_count - 1} más` : 'Te gusta') : post.likes_count}
                            </Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }} />
                    {post.comments_count > 0 && (
                        <Text style={[wallStyles.statText, { color: tc.textMuted }]}>
                            {post.comments_count} comentario{post.comments_count > 1 ? 's' : ''}
                        </Text>
                    )}
                </View>
            )}

            {/* Actions */}
            <View style={[wallStyles.actions, { borderTopColor: tc.borderLight }]}>
                <Pressable style={({ pressed }) => [wallStyles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleLike(post.id)}>
                    <Heart size={16} color={liked ? colors.danger : tc.textSecondary} fill={liked ? colors.danger : 'transparent'} />
                    <Text style={[wallStyles.actionLabel, { color: liked ? colors.danger : tc.textSecondary }]}>Me gusta</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [wallStyles.actionBtn, pressed && { opacity: 0.6 }]}>
                    <MessageCircle size={16} color={tc.textSecondary} />
                    <Text style={[wallStyles.actionLabel, { color: tc.textSecondary }]}>Comentar</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [wallStyles.actionBtn, pressed && { opacity: 0.6 }]}>
                    <Share2 size={16} color={tc.textSecondary} />
                    <Text style={[wallStyles.actionLabel, { color: tc.textSecondary }]}>Compartir</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [wallStyles.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => toggleSave(post.id)}>
                    <Bookmark size={16} color={saved ? colors.primary.DEFAULT : tc.textSecondary} fill={saved ? colors.primary.DEFAULT : 'transparent'} />
                </Pressable>
            </View>
        </View>
    );
}

// =============================================
// ESTILOS — Profile Page (Facebook-like)
// =============================================
const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14 },
    floatingBack: { position: 'absolute', top: 50, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },

    // Cover
    coverContainer: { width: '100%', position: 'relative' },
    coverBackBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, borderRadius: 20, padding: 8 },
    editCoverBtn: { position: 'absolute', bottom: 16, right: 16, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
    editCoverText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Profile Section
    profileSection: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 0 },
    profileInfoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
    profileInfoRowMobile: { flexDirection: 'column', alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    profileAvatar: { borderWidth: 4 },
    editAvatarBtn: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    profileMeta: { flex: 1, paddingBottom: 8 },
    profileMetaMobile: { alignItems: 'center', paddingTop: 8 },
    profileName: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    statNumber: { fontSize: 15, fontWeight: '700' },
    statLabel: { fontSize: 13 },
    profileActions: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end', paddingBottom: 8 },
    profileActionsMobile: { alignSelf: 'center', paddingTop: 12, paddingBottom: 0 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
    editBtnText: { fontSize: 14, fontWeight: '600' },
    followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    followBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    messageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
    messageBtnText: { fontSize: 14, fontWeight: '600' },

    // Tabs
    tabBar: { borderBottomWidth: 0.5 },
    tabScroll: { paddingHorizontal: 16 },
    tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomWidth: 3 },
    tabLabel: { fontSize: 14, fontWeight: '500' },

    // Content Area
    contentArea: { padding: 16 },
    twoColumnLayout: { flexDirection: 'row', gap: 16 },

    // Sidebar
    sidebar: { width: 340, gap: 16 },
    sidebarCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
    sidebarCardTitle: { fontSize: 18, fontWeight: '700' },
    sidebarCardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    introItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    introText: { fontSize: 14, flex: 1 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    photoThumb: { width: '31.5%', aspectRatio: 1, borderRadius: 6 },

    // Feed
    feedColumn: { flex: 1, gap: 16 },

    // Empty states
    emptyCard: { borderRadius: 12, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12 },
    emptyTitle: { fontSize: 17, fontWeight: '600' },
    emptySubtext: { fontSize: 14, textAlign: 'center' },

    // Info Tab
    infoCard: { borderRadius: 12, borderWidth: 1, padding: 24, gap: 20 },
    infoTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },

    // Photos Tab
    photosTabContainer: { borderRadius: 12, borderWidth: 1, padding: 16 },
    photosFullGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    photoFull: { width: '32%', aspectRatio: 1, borderRadius: 8 },
});

// =============================================
// ESTILOS — Wall Post Card
// =============================================
const wallStyles = StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    authorName: { fontSize: 14, fontWeight: '700' },
    postTime: { fontSize: 12 },
    content: { fontSize: 14, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 12 },
    postImage: { width: '100%', height: 300 },
    stats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 0.5 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    likeBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' },
    statText: { fontSize: 13 },
    actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4, borderTopWidth: 0.5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 },
    actionLabel: { fontSize: 13, fontWeight: '600' },
});
