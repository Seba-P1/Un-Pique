import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Image, Pressable, ActivityIndicator, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore, Post } from '../../stores/socialStore';
import { useListingStore } from '../../stores/listingStore';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    User, Settings, LogOut, MapPin, ShoppingBag, Bell, HelpCircle,
    ChevronRight, Store, Bike, Sun, Moon, Monitor,
    MessageCircle, Bookmark, Briefcase, Camera, Edit3, Grid3X3,
    Heart, MoreHorizontal, BookmarkCheck, Share2
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { useOpenMobileDrawer } from './_layout';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppHeader } from '../../components/ui/AppHeader';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../services/imageUpload';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import LoyaltyCard from '../../components/loyalty/LoyaltyCard';
import { PostCard } from '../../components/social/SharedPost';

type ProfileView = 'wall' | 'settings';

export default function ProfileScreen() {
    const { user, profile, signOut, currentRole, setCurrentRole, fetchProfile } = useAuthStore();
    const { loyalty } = useLoyaltyStore();
    const { fetchUserPosts, toggleLike, isLiked, isSaved, toggleSave, savedPosts } = useSocialStore();
    const { userListings, fetchUserListings } = useListingStore();
    const { theme, setTheme } = useThemeStore();
    const tc = useThemeColors();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const openDrawer = useOpenMobileDrawer();
    const [activeView, setActiveView] = useState<ProfileView>('wall');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;
    const contentMaxWidth = 960;

    const scrollY = useRef(new Animated.Value(0)).current;

    const hasBusinessRole = profile?.roles?.includes('business_owner') || profile?.roles?.includes('seller' as any);
    const hasDriverRole = profile?.roles?.includes('delivery_driver') || profile?.roles?.includes('driver' as any);
    const showRolesSection = hasBusinessRole || hasDriverRole;
    const hasListings = userListings.length > 0;

    useEffect(() => {
        fetchUserListings();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadPosts();
        }, [])
    );

    const loadPosts = async () => {
        if (!user) return;
        setLoadingPosts(true);
        const data = await fetchUserPosts(user.id);
        setPosts(data);
        setLoadingPosts(false);
    };

    const [tempCoverUrl, setTempCoverUrl] = useState<string | null>(null);
    const [uploadingCover, setUploadingCover] = useState(false);

    const handleEditCover = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const imgUrl = result.assets[0].uri;
                setTempCoverUrl(imgUrl);
                setUploadingCover(true);

                const uploadRes = await uploadImage(imgUrl, 'covers', user?.id || 'misc', { maxWidth: 1200, maxHeight: 800, quality: 0.8 });
                const publicUrl = uploadRes.url;

                const { error: dbError } = await supabase
                    .from('users')
                    .update({ cover_url: publicUrl })
                    .eq('id', user?.id);

                if (dbError) {
                    console.warn('cover_url update failed (column may not exist yet):', dbError.message);
                    showAlert('Error en base de datos', dbError.message);
                } else {
                    await fetchProfile();
                }
            }
        } catch (error: any) {
            console.error(error);
            showAlert('Error', 'No se pudo subir la imagen');
            setTempCoverUrl(null);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const handleEditProfile = () => {
        router.push('/edit-profile' as any);
    };

    const coverHeight = isMobile ? 180 : 280;
    const avatarSize = isMobile ? 90 : 120;

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Header flotante sobre el cover */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <AppHeader
                    subtitle="MI CUENTA"
                    title="Mi Perfil"
                    leftIcon="menu"
                    rightButtons={['messages', 'notifications']}
                    scrollY={scrollY}
                />
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* ====== COVER PHOTO ====== */}
                <View style={[styles.coverContainer, { height: coverHeight, backgroundColor: tc.bgInput }]}>
                    {(tempCoverUrl || profile?.cover_url) ? (
                        <Image 
                            source={{ uri: tempCoverUrl || profile?.cover_url }} 
                            style={StyleSheet.absoluteFillObject} 
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: tc.textMuted, fontSize: 14, fontWeight: '500' }}>Toca para cambiar el banner</Text>
                        </View>
                    )}
                    <LinearGradient
                        colors={[(tempCoverUrl || profile?.cover_url) ? 'transparent' : colors.primary.DEFAULT + '50', tc.bg]}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                    />
                    <TouchableOpacity 
                        style={[styles.editCoverBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} 
                        onPress={handleEditCover}
                        disabled={uploadingCover}
                    >
                        {uploadingCover ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Camera size={15} color="#fff" />
                        )}
                        {!isMobile && <Text style={styles.editCoverText}>{uploadingCover ? 'Subiendo...' : 'Editar portada'}</Text>}
                    </TouchableOpacity>
                </View>

                {/* ====== PROFILE INFO ====== */}
                <View style={[styles.profileSection, !isMobile && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                    <View style={[styles.profileInfoRow, isMobile && styles.profileInfoRowMobile]}>
                        {/* Avatar */}
                        <View style={[styles.avatarWrapper, { marginTop: -(avatarSize / 2) }]}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={[styles.profileAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: tc.bgCard }]} />
                            ) : (
                                <LinearGradient colors={[colors.primary.DEFAULT, '#ea580c']} style={[styles.profileAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: tc.bgCard, justifyContent: 'center', alignItems: 'center' }]}>
                                    <User size={avatarSize * 0.45} color="#fff" />
                                </LinearGradient>
                            )}
                            <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: tc.bgInput, borderColor: tc.bgCard }]} onPress={handleEditProfile}>
                                <Camera size={15} color={tc.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Name + Meta */}
                        <View style={[styles.profileMeta, isMobile && styles.profileMetaMobile]}>
                            <Text style={[styles.profileName, { color: tc.text }]}>{profile?.full_name || 'Usuario'}</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <MapPin size={13} color={tc.textMuted} />
                                    <Text style={[styles.metaText, { color: tc.textMuted }]}>Río Colorado</Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <Text style={[styles.statNumber, { color: tc.text }]}>{posts.length}</Text>
                                <Text style={[styles.statLabel, { color: tc.textMuted }]}>publicaciones</Text>
                                <Text style={[styles.statSep, { color: tc.borderLight }]}>·</Text>
                                <Text style={[styles.statNumber, { color: tc.text }]}>{savedPosts.length}</Text>
                                <Text style={[styles.statLabel, { color: tc.textMuted }]}>guardados</Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={[styles.profileActions, isMobile && styles.profileActionsMobile]}>
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handleEditProfile}>
                                <Edit3 size={15} color={tc.text} />
                                <Text style={[styles.editBtnText, { color: tc.text }]}>Editar perfil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ====== LOYALTY CARD COMPACT ====== */}
                {loyalty && (
                    <TouchableOpacity 
                        style={{ paddingHorizontal: 20, marginBottom: 16 }}
                        onPress={() => router.push('/loyalty' as any)}
                        activeOpacity={0.9}
                    >
                        <View pointerEvents="none" style={{ transform: [{ scale: 0.95 }], marginTop: -10, marginBottom: -10 }}>
                            <LoyaltyCard loyalty={loyalty} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* ====== TAB BAR ====== */}
                <View style={[styles.tabBar, { borderBottomColor: tc.borderLight, backgroundColor: 'transparent' }, !isMobile && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                    <Pressable
                        style={[styles.tabItem, activeView === 'wall' && { borderBottomColor: colors.primary.DEFAULT, borderBottomWidth: 3 }]}
                        onPress={() => setActiveView('wall')}
                    >
                        <Grid3X3 size={16} color={activeView === 'wall' ? colors.primary.DEFAULT : tc.textMuted} />
                        <Text style={[styles.tabLabel, { color: activeView === 'wall' ? colors.primary.DEFAULT : tc.textMuted }, activeView === 'wall' && { fontWeight: '700' }]}>Mi Muro</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tabItem, activeView === 'settings' && { borderBottomColor: colors.primary.DEFAULT, borderBottomWidth: 3 }]}
                        onPress={() => setActiveView('settings')}
                    >
                        <Settings size={16} color={activeView === 'settings' ? colors.primary.DEFAULT : tc.textMuted} />
                        <Text style={[styles.tabLabel, { color: activeView === 'settings' ? colors.primary.DEFAULT : tc.textMuted }, activeView === 'settings' && { fontWeight: '700' }]}>Cuenta & Ajustes</Text>
                    </Pressable>
                </View>

                {/* ====== CONTENT AREA ====== */}
                <View style={[styles.contentArea, !isMobile && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                    {activeView === 'wall' ? (
                        <WallView posts={posts} loading={loadingPosts} tc={tc} isDesktop={isDesktop} isMobile={isMobile} isLiked={isLiked} toggleLike={toggleLike} isSaved={isSaved} toggleSave={toggleSave} router={router} savedPosts={savedPosts} profile={profile} userListings={userListings} hasBusinessRole={hasBusinessRole} />
                    ) : (
                        <SettingsView tc={tc} router={router} hasListings={hasListings} showRolesSection={showRolesSection} hasBusinessRole={hasBusinessRole} hasDriverRole={hasDriverRole} currentRole={currentRole} setCurrentRole={setCurrentRole} theme={theme} setTheme={setTheme} handleSignOut={handleSignOut} />
                    )}
                </View>

                <View style={{ height: 80 }} />
            </Animated.ScrollView>
        </View>
    );
}

// =============================================
// WALL VIEW — Mi muro integrado
// =============================================
function WallView({ posts, loading, tc, isDesktop, isMobile, isLiked, toggleLike, isSaved, toggleSave, router, savedPosts, profile, userListings, hasBusinessRole }: any) {
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [myBusiness, setMyBusiness] = useState<any>(null);

    useEffect(() => {
        if (hasBusinessRole && profile?.id) {
            supabase.from('businesses')
                .select('id, name, logo_url, cover_url, category, rating, is_open, slug')
                .eq('owner_id', profile.id)
                .single()
                .then(({ data }) => setMyBusiness(data));
        }
    }, [profile, hasBusinessRole]);

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });
    };

    if (loading) {
        return (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
        );
    }

    return (
        <View style={[wallStyles.layout, !isMobile && { flexDirection: 'row', gap: 16 }]}>
            {/* Sidebar — solo en desktop */}
            {isDesktop && (
                <View style={wallStyles.sidebar}>
                    <View style={[wallStyles.sidebarCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[wallStyles.sidebarTitle, { color: tc.text }]}>Intro</Text>
                        <View style={wallStyles.introItem}>
                            <MapPin size={15} color={tc.textMuted} />
                            <Text style={[wallStyles.introText, { color: tc.textSecondary }]}>Vive en <Text style={{ fontWeight: '600', color: tc.text }}>Río Colorado</Text></Text>
                        </View>
                        <View style={wallStyles.introItem}>
                            <Briefcase size={15} color={tc.textMuted} />
                            <Text style={[wallStyles.introText, { color: tc.textSecondary }]}>Miembro de la comunidad Un Pique</Text>
                        </View>
                    </View>

                    {savedPosts.length > 0 && (
                        <View style={[wallStyles.sidebarCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[wallStyles.sidebarTitle, { color: tc.text }]}>Guardados</Text>
                                <BookmarkCheck size={16} color={colors.primary.DEFAULT} />
                            </View>
                            <Text style={{ color: tc.textMuted, fontSize: 13 }}>{savedPosts.length} elementos</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Feed */}
            <View style={wallStyles.feed}>
                {/* ====== SECTION: Servicios que ofrezco ====== */}
                {userListings && userListings.length > 0 && (
                    <View style={[wallStyles.featureCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={wallStyles.featureHeader}>
                            <Text style={[wallStyles.featureTitle, { color: tc.text }]}>🔧 Servicios y Alojamientos</Text>
                            <TouchableOpacity onPress={() => router.push('/my-listings' as any)}>
                                <Text style={[wallStyles.featureLink, { color: colors.primary.DEFAULT }]}>Ver todos &rarr;</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
                            {userListings.slice(0, 4).map((listing: any) => (
                                <TouchableOpacity 
                                    key={listing.id} 
                                    style={[wallStyles.listingItem, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
                                    onPress={() => router.push(`/directory/${listing.id}` as any)}
                                    activeOpacity={0.9}
                                >
                                    {listing.images?.[0] ? (
                                        <Image source={{ uri: listing.images[0] }} style={wallStyles.listingImg} resizeMode="cover" />
                                    ) : (
                                        <View style={[wallStyles.listingImgPlaceholder, { backgroundColor: tc.bgCard }]}>
                                            <Briefcase size={24} color={tc.textMuted} />
                                        </View>
                                    )}
                                    <View style={wallStyles.listingContent}>
                                        <Text style={[wallStyles.listingTitle, { color: tc.text }]} numberOfLines={1}>{listing.title}</Text>
                                        <Text style={[wallStyles.listingCat, { color: tc.textMuted }]} numberOfLines={1}>{listing.category || listing.accommodation_type}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {userListings.length > 4 && (
                                <TouchableOpacity 
                                    style={[wallStyles.listingMore, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
                                    onPress={() => router.push('/my-listings' as any)}
                                >
                                    <Text style={[wallStyles.listingMoreText, { color: tc.text }]}>+{userListings.length - 4} más</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* ====== SECTION: Mi negocio en Sabor Local ====== */}
                {hasBusinessRole && myBusiness && (
                    <View style={[wallStyles.featureCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, padding: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                            <Text style={{ fontSize: 18 }}>🏪</Text>
                            <Text style={[wallStyles.featureTitle, { color: tc.text }]}>Mi local en Sabor Local</Text>
                        </View>
                        <View style={[wallStyles.businessCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }, isMobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                {myBusiness.logo_url ? (
                                    <Image source={{ uri: myBusiness.logo_url }} style={wallStyles.businessLogo} />
                                ) : (
                                    <View style={[wallStyles.businessLogoPlaceholder, { backgroundColor: tc.bgCard }]}>
                                        <Store size={24} color={tc.textMuted} />
                                    </View>
                                )}
                                <View style={wallStyles.businessInfo}>
                                    <Text style={[wallStyles.businessName, { color: tc.text }]} numberOfLines={1}>{myBusiness.name}</Text>
                                    <Text style={[wallStyles.businessCat, { color: tc.textMuted }]}>{myBusiness.category}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                        <Text style={{ fontSize: 13, color: tc.textSecondary, fontWeight: '600' }}>⭐ {myBusiness.rating?.toFixed(1) || 'N/A'}</Text>
                                        <Text style={{ color: tc.textMuted, fontSize: 12 }}>•</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: myBusiness.is_open ? '#22C55E' : '#EF4444' }} />
                                            <Text style={{ fontSize: 12, color: tc.textSecondary, fontWeight: '600' }}>{myBusiness.is_open ? 'Abierto' : 'Cerrado'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={[wallStyles.businessBtn, { backgroundColor: tc.text }, isMobile && { marginTop: 12, alignSelf: 'stretch', alignItems: 'center' }]}
                                onPress={() => router.push(`/shop/${myBusiness.slug || myBusiness.id}` as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={{ color: tc.bg, fontWeight: '700', fontSize: 14 }}>Ver mi tienda &rarr;</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ====== PUBLICACIONES ====== */}
                {posts.length > 0 ? (
                    posts.map((item: Post) => (
                        <PostCard 
                            key={item.id} 
                            item={item} 
                            tc={tc} 
                            isDesktop={isDesktop} 
                            toggleLike={toggleLike} 
                            isLiked={isLiked} 
                            toggleComments={toggleComments}
                            expandedComments={expandedComments}
                            onShowMenu={null}
                            currentLocality={null}
                        />
                    ))
                ) : (
                    <View style={[wallStyles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Grid3X3 size={36} color={tc.textMuted} />
                        <Text style={[wallStyles.emptyTitle, { color: tc.text }]}>Tu muro está vacío</Text>
                        <Text style={[wallStyles.emptySubtext, { color: tc.textMuted }]}>Compartí algo con la comunidad desde la sección Social</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

// (WallPostCard component removed)

// =============================================
// SETTINGS VIEW — Cuenta, roles, apariencia
// =============================================
function SettingsView({ tc, router, hasListings, showRolesSection, hasBusinessRole, hasDriverRole, currentRole, setCurrentRole, theme, setTheme, handleSignOut }: any) {
    return (
        <View style={settingsStyles.container}>
            {/* Account Links */}
            <View style={[settingsStyles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <Text style={[settingsStyles.cardLabel, { color: tc.textMuted }]}>CUENTA</Text>
                {hasBusinessRole && (
                    <NavPacket 
                        icon={Store} 
                        label="Panel de Vendedor" 
                        tc={tc} 
                        highlight
                        onPress={() => router.push('/business/dashboard' as any)} 
                    />
                )}
                <NavPacket icon={ShoppingBag} label="Mis Pedidos" tc={tc} onPress={() => router.push('/orders' as any)} />
                <NavPacket icon={Briefcase} label="Mis Publicaciones" tc={tc} onPress={() => router.push('/my-listings' as any)} />
                <NavPacket icon={Bell} label="Notificaciones" tc={tc} onPress={() => router.push('/notifications' as any)} />
                <NavPacket icon={Settings} label="Configuración" tc={tc} highlight onPress={() => router.push('/settings')} />
                <NavPacket icon={HelpCircle} label="Ayuda" tc={tc} onPress={() => router.push('/help' as any)} />
            </View>

            {/* Role Switcher */}
            {showRolesSection && (
                <View style={settingsStyles.section}>
                    <Text style={[settingsStyles.sectionTitle, { color: tc.text }]}>Cambiar de rol</Text>
                    <View style={settingsStyles.rolesGrid}>
                        {hasBusinessRole && (
                            <RoleCard icon={Store} label="Vendedor" description="Gestiona tu tienda" active={currentRole === 'business_owner'} onPress={() => { if (currentRole === 'business_owner') { setCurrentRole('customer'); } else { setCurrentRole('business_owner'); router.push('/business/dashboard' as any); } }} color={colors.primary.DEFAULT} tc={tc} />
                        )}
                        {hasDriverRole && (
                            <RoleCard icon={Bike} label="Repartidor" description="Gestiona entregas" active={currentRole === 'delivery_driver'} onPress={() => { if (currentRole === 'delivery_driver') { setCurrentRole('customer'); } else { setCurrentRole('delivery_driver'); router.push('/driver/dashboard' as any); } }} color="#22c55e" tc={tc} />
                        )}
                    </View>
                </View>
            )}

            {/* Appearance */}
            <View style={settingsStyles.section}>
                <Text style={[settingsStyles.sectionTitle, { color: tc.text }]}>Apariencia</Text>
                <View style={[settingsStyles.themeSelector, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <ThemeOption icon={Sun} label="Claro" active={theme === 'light'} onPress={() => setTheme('light')} tc={tc} />
                    <ThemeOption icon={Moon} label="Oscuro" active={theme === 'dark'} onPress={() => setTheme('dark')} tc={tc} />
                    <ThemeOption icon={Monitor} label="Sistema" active={theme === 'system'} onPress={() => setTheme('system')} tc={tc} />
                </View>
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={[settingsStyles.logoutBtn, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={handleSignOut}>
                <LogOut size={18} color={colors.error} />
                <Text style={[settingsStyles.logoutText, { color: colors.error }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

// =============================================
// SUBCOMPONENTS
// =============================================
function NavPacket({ icon: Icon, label, tc, highlight, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={[settingsStyles.navPacket, highlight && { backgroundColor: 'rgba(249, 115, 22, 0.05)', borderLeftWidth: 3, borderLeftColor: colors.primary.DEFAULT }]}>
            <View style={settingsStyles.navPacketLeft}>
                <View style={[settingsStyles.navIconBox, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                    <Icon size={18} color={highlight ? colors.primary.DEFAULT : tc.textMuted} />
                </View>
                <Text style={[settingsStyles.navLabel, { color: highlight ? colors.primary.DEFAULT : tc.text }, highlight && { fontWeight: 'bold' }]}>{label}</Text>
            </View>
            <ChevronRight size={18} color={highlight ? colors.primary.DEFAULT : tc.textMuted} />
        </TouchableOpacity>
    );
}

function RoleCard({ icon: Icon, label, description, active, onPress, color, tc }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={[settingsStyles.roleCard, { backgroundColor: tc.bgCard, borderColor: active ? color : tc.borderLight }, active && { borderWidth: 2 }]}>
            <View style={[settingsStyles.roleIcon, { backgroundColor: tc.bg }]}><Icon size={24} color={active ? color : tc.textMuted} /></View>
            {active && <View style={[settingsStyles.roleIndicator, { backgroundColor: color }]} />}
            <Text style={[settingsStyles.roleTitle, { color: tc.text }]}>{label}</Text>
            <Text style={[settingsStyles.roleDesc, { color: tc.textMuted }]}>{description}</Text>
        </TouchableOpacity>
    );
}

function ThemeOption({ icon: Icon, label, active, onPress, tc }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={[settingsStyles.themeOption, active && { backgroundColor: tc.bgInput }]}>
            <Icon size={18} color={active ? colors.primary.DEFAULT : tc.textMuted} />
            <Text style={[settingsStyles.themeLabel, { color: active ? tc.text : tc.textMuted }, active && { fontWeight: '600' }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// =============================================
// STYLES
// =============================================
const styles = StyleSheet.create({
    container: { flex: 1 },
    // Header
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

    // Cover
    coverContainer: { width: '100%', position: 'relative' },
    editCoverBtn: { position: 'absolute', bottom: 14, right: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
    editCoverText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Profile Section
    profileSection: { paddingHorizontal: 20, paddingBottom: 12 },
    profileInfoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
    profileInfoRowMobile: { flexDirection: 'column', alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    profileAvatar: { borderWidth: 4 },
    editAvatarBtn: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
    profileMeta: { flex: 1, paddingBottom: 6 },
    profileMetaMobile: { alignItems: 'center', paddingTop: 8 },
    profileName: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 3 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 13 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    statNumber: { fontSize: 14, fontWeight: '700' },
    statLabel: { fontSize: 13 },
    statSep: { fontSize: 14 },
    profileActions: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end', paddingBottom: 6 },
    profileActionsMobile: { alignSelf: 'center', paddingTop: 10 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1 },
    editBtnText: { fontSize: 14, fontWeight: '600' },

    // Tabs
    tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderTopWidth: 0, justifyContent: 'center', width: '100%', alignSelf: 'center' },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabLabel: { fontSize: 14, fontWeight: '500' },

    // Content
    contentArea: { padding: 16 },
});

// Wall styles
const wallStyles = StyleSheet.create({
    layout: { gap: 16 },
    sidebar: { width: 320, gap: 16 },
    sidebarCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
    sidebarTitle: { fontSize: 17, fontWeight: '700' },
    introItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    introText: { fontSize: 14, flex: 1 },
    feed: { flex: 1, gap: 16 },
    emptyCard: { borderRadius: 12, borderWidth: 1, padding: 40, alignItems: 'center', gap: 10 },
    emptyTitle: { fontSize: 17, fontWeight: '600' },
    emptySubtext: { fontSize: 14, textAlign: 'center' },
    // Post Card
    postCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    postAvatar: { width: 40, height: 40, borderRadius: 20 },
    postAuthor: { fontSize: 14, fontWeight: '700' },
    postTime: { fontSize: 12 },
    postContent: { fontSize: 14, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 12 },
    postImage: { width: '100%', height: 280 },
    postStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 0.5 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    likeBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' },
    statText: { fontSize: 13 },
    postActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4, borderTopWidth: 0.5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 },
    actionLabel: { fontSize: 13, fontWeight: '600' },
    sharedServiceCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
    sharedServiceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    // Features (Services & Business)
    featureCard: { borderRadius: 16, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
    featureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    featureTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    featureLink: { fontSize: 14, fontWeight: '600' },
    listingItem: { width: 140, borderRadius: 14, borderWidth: 1, overflow: 'hidden', height: 110 },
    listingImg: { width: '100%', height: 60 },
    listingImgPlaceholder: { width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' },
    listingContent: { padding: 8, justifyContent: 'center' },
    listingTitle: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
    listingCat: { fontSize: 11, marginTop: 2 },
    listingMore: { width: 90, borderRadius: 14, borderWidth: 1, height: 110, justifyContent: 'center', alignItems: 'center' },
    listingMoreText: { fontSize: 14, fontWeight: '700' },
    businessCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
    businessLogo: { width: 64, height: 64, borderRadius: 12 },
    businessLogoPlaceholder: { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    businessInfo: { flex: 1, justifyContent: 'center' },
    businessName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    businessCat: { fontSize: 13, marginTop: 2 },
    businessBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginLeft: 8 },
});

// Settings styles
const settingsStyles = StyleSheet.create({
    container: { gap: 20 },
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    cardLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginLeft: 20, marginTop: 20, marginBottom: 4 },
    navPacket: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20 },
    navPacketLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    navIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    navLabel: { fontSize: 15, fontWeight: '500' },
    section: { gap: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700' },
    rolesGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    roleCard: { flex: 1, minWidth: 180, padding: 20, borderRadius: 16, borderWidth: 1, position: 'relative', gap: 8 },
    roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    roleIndicator: { position: 'absolute', top: 16, right: 16, width: 10, height: 10, borderRadius: 5 },
    roleTitle: { fontSize: 16, fontWeight: '700' },
    roleDesc: { fontSize: 13 },
    themeSelector: { flexDirection: 'row', padding: 5, borderRadius: 9999, borderWidth: 1 },
    themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 9999 },
    themeLabel: { fontSize: 14 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 9999, borderWidth: 1 },
    logoutText: { fontSize: 15, fontWeight: '700' },
});
