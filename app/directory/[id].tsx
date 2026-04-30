import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, Linking,
    Platform, ActivityIndicator, Modal, TextInput, Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Star, MessageCircle, Share2, Clock, ArrowLeft, AlertTriangle, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';
import { supabase } from '../../lib/supabase';
import type { Listing } from '../../stores/listingStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useLocationStore } from '../../stores/locationStore';
import { useSocialStore } from '../../stores/socialStore';
import { AppHeader } from '../../components/ui/AppHeader';

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const insets = useSafeAreaInsets();
    const { isDesktop, isMobile, maxContentWidth, isWidescreen } = useResponsive();

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareComment, setShareComment] = useState('');

    const scrollY = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(30)).current;

    const toggleFavorite = useFavoritesStore(s => s.toggleFavorite);
    const isFavorite = useFavoritesStore(s => s.isFavorite);
    const serviceId = listing?.id || id;
    const isSaved = isFavorite('listing', serviceId);

    useEffect(() => {
        if (id) fetchListing();
    }, [id]);

    useEffect(() => {
        if (!listing) return;
        Animated.parallel([
            Animated.timing(cardAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(cardSlide, { toValue: 0, stiffness: 110, damping: 13, useNativeDriver: true }),
        ]).start();
    }, [listing?.id]);

    const fetchListing = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setListing(data as Listing);
        } catch (err) {
            console.error('Error fetching listing:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Parallax banner ──
    const bannerHeight = isMobile ? 280 : 380;
    const bannerTranslate = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    // ── Glass styles ──
    const mobileContentStyle = !isDesktop ? (
        Platform.OS === 'web' ? {
            backgroundColor: tc.isDark
                ? 'rgba(18,18,18,0.92)'
                : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderWidth: 1,
            borderColor: tc.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.8)',
            boxShadow: tc.isDark
                ? '0 -8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 -8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
        } as any : {
            backgroundColor: tc.isDark
                ? 'rgba(18,18,18,0.95)'
                : 'rgba(255,255,255,0.95)',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: tc.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: tc.isDark ? 0.5 : 0.12,
            shadowRadius: 24,
            elevation: 16,
        }
    ) : {};

    const infoCardGlass = Platform.OS === 'web' ? {
        backgroundColor: tc.isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderWidth: 1,
        borderColor: tc.isDark
            ? 'rgba(255,255,255,0.09)'
            : 'rgba(255,255,255,0.9)',
        boxShadow: tc.isDark
            ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
    } as any : {
        backgroundColor: tc.isDark
            ? 'rgba(40,40,42,0.85)'
            : 'rgba(255,255,255,0.85)',
        borderWidth: 1,
        borderColor: tc.isDark
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: tc.isDark ? 0.25 : 0.08,
        shadowRadius: 16,
        elevation: 8,
    };

    // ── Loading / Error states ──
    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: tc.bg }]}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
        );
    }

    if (!listing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: tc.bg }]}>
                <AlertTriangle size={40} color={tc.textMuted} />
                <Text style={[styles.errorText, { color: tc.textMuted }]}>Publicación no encontrada</Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backLinkBtn, { borderColor: tc.borderLight }]}>
                    <Text style={{ color: tc.primary, fontWeight: '600' }}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Handlers ──
    const handleCall = () => {
        if (!listing.phone) return showAlert('Sin teléfono', 'Este servicio no tiene teléfono registrado.');
        Linking.openURL(`tel:${listing.phone}`).catch(() => showAlert('Error', 'No se pudo abrir el teléfono.'));
    };

    const handleWhatsApp = () => {
        if (!listing.phone) return showAlert('Sin teléfono', 'Este servicio no tiene WhatsApp registrado.');
        const cleanPhone = listing.phone.replace(/[^0-9+]/g, '');
        Linking.openURL(`https://wa.me/${cleanPhone}`);
    };

    const handleShare = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showAlert('Iniciá sesión', 'Necesitás estar logueado para compartir');
            return;
        }
        setShareModalVisible(true);
    };

    const submitShare = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setSharing(true);
            const localityId = useLocationStore.getState().currentLocality?.id;
            if (!localityId) {
                showAlert('Error', 'No se pudo determinar tu localidad. Reabrí la app.');
                setSharing(false);
                return;
            }
            const serviceName = listing?.title || 'Servicio';
            const postContent = shareComment
                ? shareComment + '\n\n[service:' + serviceId + ':' + serviceName + ']'
                : '[service:' + serviceId + ':' + serviceName + ']';
            await useSocialStore.getState().createPost(postContent.trim(), [], localityId);
            showAlert('¡Listo!', 'El servicio fue compartido en tu muro');
            setShareModalVisible(false);
            setShareComment('');
        } catch (err: any) {
            console.error('[Share service] Error real:', JSON.stringify(err));
            showAlert('Error', 'No se pudo compartir: ' + (err?.message || JSON.stringify(err)));
        } finally {
            setSharing(false);
        }
    };

    const coverImage = listing.images?.[0] || 'https://via.placeholder.com/800x400?text=Sin+imagen';

    // ── Shared content blocks ──
    const renderInfoMain = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={[styles.name, { color: tc.text }]}>{listing.title}</Text>
                    <Text style={[styles.category, { color: tc.textMuted }]}>{listing.category || listing.accommodation_type || ''}</Text>
                    <View style={styles.ratingRow}>
                        <Star size={14} color={colors.warning} fill={colors.warning} />
                        <Text style={[styles.rating, { color: tc.textSecondary }]}>
                            {listing.rating?.toFixed(1) || '0.0'} ({listing.reviews_count || 0} opiniones)
                        </Text>
                    </View>
                </View>
            </View>

            {listing.description ? (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Sobre Nosotros</Text>
                    <Text style={[styles.description, { color: tc.textSecondary }]}>{listing.description}</Text>
                </View>
            ) : null}

            {/* Gallery */}
            {listing.images && listing.images.length > 1 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Galería</Text>
                    <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {listing.images.map((img: string, i: number) => (
                            <Image key={i} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                        ))}
                    </Animated.ScrollView>
                </View>
            )}
        </>
    );

    const renderInfoCard = () => (
        <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }] }}>
            <View style={[styles.infoCard, infoCardGlass]}>
                {listing.address ? (
                    <>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={tc.primary} />
                            <Text style={[styles.infoText, { color: tc.text }]}>{listing.address}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                    </>
                ) : null}
                {listing.phone ? (
                    <>
                        <View style={styles.infoRow}>
                            <Phone size={20} color={tc.primary} />
                            <Text style={[styles.infoText, { color: tc.text }]}>{listing.phone}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                    </>
                ) : null}
                {listing.hourly_rate ? (
                    <View style={styles.infoRow}>
                        <Clock size={20} color={tc.primary} />
                        <Text style={[styles.infoText, { color: tc.text }]}>${listing.hourly_rate}/hr</Text>
                    </View>
                ) : null}
            </View>

            {/* Action buttons */}
            <View style={styles.actionsGrid}>
                <TouchableOpacity
                    style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, opacity: sharing ? 0.5 : 1 }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Share2 size={22} color={tc.textSecondary} />
                    <Text style={[styles.actionBtnTextSec, { color: tc.textSecondary }]}>Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                    onPress={() => toggleFavorite('listing', serviceId)}
                >
                    <Heart size={22} color={isSaved ? '#ef4444' : tc.textSecondary} fill={isSaved ? '#ef4444' : 'transparent'} />
                    <Text style={[styles.actionBtnTextSec, { color: isSaved ? '#ef4444' : tc.textSecondary }]}>{isSaved ? 'Guardado' : 'Guardar'}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* AppHeader */}
            <AppHeader
                title={listing?.title ?? ''}
                subtitle="SERVICIOS"
                leftIcon="back"
                rightButtons={['favorites']}
                scrollY={scrollY}
            />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 130 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Parallax Banner */}
                <Animated.View style={{
                    transform: [{ translateY: bannerTranslate }],
                    height: bannerHeight,
                    overflow: 'hidden',
                }}>
                    <Image
                        source={{ uri: coverImage }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                </Animated.View>

                {/* Content */}
                {isDesktop ? (
                    /* ══ Desktop: 2 columns ══ */
                    <View style={{
                        flexDirection: 'row',
                        maxWidth: maxContentWidth,
                        alignSelf: 'center',
                        width: '100%',
                        paddingHorizontal: isWidescreen ? 32 : 24,
                        paddingTop: 32,
                        gap: isWidescreen ? 32 : 24,
                    }}>
                        {/* Left column — main info */}
                        <View style={{ flex: 1, minWidth: 0 }}>
                            {renderInfoMain()}
                        </View>

                        {/* Right column — sticky sidebar */}
                        <View style={{
                            width: isWidescreen ? 340 : 280,
                            ...(Platform.OS === 'web' ? {
                                position: 'sticky' as any,
                                top: 80,
                                alignSelf: 'flex-start',
                                height: 'fit-content' as any,
                            } : { alignSelf: 'flex-start' })
                        }}>
                            {renderInfoCard()}
                        </View>
                    </View>
                ) : (
                    /* ══ Mobile: stacked ══ */
                    <View style={[styles.contentContainer, mobileContentStyle]}>
                        {renderInfoMain()}
                        {renderInfoCard()}
                    </View>
                )}
            </Animated.ScrollView>

            {/* ══ Floating Contact Buttons ══ */}
            <View style={{
                position: 'absolute',
                bottom: Math.max(insets.bottom + 10, 24),
                left: 20,
                right: 20,
                flexDirection: 'row',
                gap: 12,
                zIndex: 20,
            }}>
                {/* Phone — circular */}
                <TouchableOpacity
                    onPress={handleCall}
                    style={[
                        {
                            width: 54,
                            height: 54,
                            borderRadius: 27,
                            backgroundColor: tc.bgCard,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: tc.isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.08)',
                        },
                        Platform.OS === 'web' ? {
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        } as any : {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 8,
                        },
                    ]}
                >
                    <Phone size={22} color={tc.text} />
                </TouchableOpacity>

                {/* WhatsApp — pill */}
                <TouchableOpacity
                    onPress={handleWhatsApp}
                    style={[
                        {
                            flex: 1,
                            height: 54,
                            borderRadius: 27,
                            backgroundColor: '#25D366',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        },
                        Platform.OS === 'web' ? {
                            boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
                        } as any : {
                            shadowColor: '#25D366',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.4,
                            shadowRadius: 16,
                            elevation: 10,
                        },
                    ]}
                >
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
                        <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </Svg>
                    <Text style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '700',
                        letterSpacing: 0.3,
                    }}>
                        Enviar WhatsApp
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ══ Share Modal ══ */}
            <Modal visible={shareModalVisible} transparent animationType="fade">
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
                    alignItems: 'center',
                    paddingHorizontal: Platform.OS === 'web' ? 20 : 0,
                    paddingVertical: Platform.OS === 'web' ? 20 : 0,
                }}>
                    <View style={{
                        width: '100%',
                        maxWidth: 440,
                        borderRadius: Platform.OS === 'web' ? 20 : 0,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 24,
                        paddingBottom: Platform.OS === 'web' ? 24 : 40,
                        backgroundColor: tc.bgCard,
                    }}>
                        <Text style={{
                            fontSize: 18, fontWeight: '700',
                            marginBottom: 16, textAlign: 'center',
                            color: tc.text,
                        }}>
                            Compartir en tu muro
                        </Text>
                <TextInput
                    style={[styles.modalInput, { borderColor: tc.borderLight, color: tc.text, backgroundColor: tc.bg }]}
                            placeholder="Agregá un comentario (opcional)..."
                            placeholderTextColor={tc.textMuted}
                            value={shareComment}
                            onChangeText={setShareComment}
                            multiline
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: tc.borderLight }]}
                                onPress={() => setShareModalVisible(false)}
                                disabled={sharing}
                            >
                                <Text style={{ color: tc.text, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSubmit]}
                                onPress={submitShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={styles.modalBtnTextContainer}>
                                        <Share2 size={16} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Publicar</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorText: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },

    // Content container (mobile)
    contentContainer: {
        flex: 1,
        marginTop: -40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 20,
        paddingTop: 32,
    },

    // Header info
    header: { flexDirection: 'row', marginBottom: 24 },
    headerText: { flex: 1 },
    name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
    category: { fontSize: 14, marginBottom: 4, marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    rating: { fontSize: 13, fontWeight: '500' },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    description: { fontSize: 15, lineHeight: 23 },

    // Info card (glass)
    infoCard: { borderRadius: 20, padding: 18, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14 },
    infoText: { fontSize: 15, flex: 1 },
    divider: { height: 1 },

    // Actions
    actionsGrid: { flexDirection: 'row', gap: 12, marginTop: 4 },
    actionBtnSecondary: {
        flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
        justifyContent: 'center', borderWidth: 1, gap: 6,
    },
    actionBtnTextSec: { fontSize: 13, fontWeight: '600' },

    // Gallery
    galleryImage: { width: 160, height: 120, borderRadius: 16 },

    // Modal
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    modalInput: { borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 80, textAlignVertical: 'top', fontSize: 15, marginBottom: 16 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: 'transparent', borderWidth: 1 },
    modalBtnSubmit: { backgroundColor: '#FF6B35' },
    modalBtnTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
