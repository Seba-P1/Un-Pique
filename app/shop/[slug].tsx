import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Animated, Image, TouchableOpacity,
    StatusBar, Platform, FlatList, Pressable, Linking, Alert, Share,
    Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Star, MapPin, Search, Share2, Heart, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { ProductItem } from '../../components/shop';
import { useCartStore } from '../../stores/cartStore';
import { useBusinessStore } from '../../stores/businessStore';
import { useProductStore } from '../../stores/productStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useSocialStore } from '../../stores/socialStore';
import { useLocationStore } from '../../stores/locationStore';
import { supabase } from '../../lib/supabase';
import { showAlert } from '../../utils/alert';
import { Skeleton } from '../../components/ui/Skeleton';
import BusinessMap from '../../components/shop/BusinessMap';
import { useThemeColors } from '../../hooks/useThemeColors';
import { checkIsBusinessOpen, getFormattedScheduleList } from '../../utils/schedule';
import { useResponsive } from '../../hooks/useResponsive';
import { AppHeader } from '../../components/ui/AppHeader';

const HEADER_HEIGHT = 280;

// ─── BusinessInfoCard ────────────────────────────────────────────
function BusinessInfoCard({ business, isBusinessFavorite, onFavorite, onShare, tc }: {
    business: any; isBusinessFavorite: boolean; onFavorite: () => void; onShare?: () => void; tc: any;
}) {
    const isOpen = business?.is_open && checkIsBusinessOpen(business?.schedule);
    const scheduleList = business ? getFormattedScheduleList(business.schedule) : [];
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const starScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])).start();
        }
    }, [isOpen]);

    useEffect(() => {
        Animated.spring(starScale, {
            toValue: 1, stiffness: 200, damping: 12, useNativeDriver: true,
        }).start();
    }, []);

    const glassStyle = Platform.OS === 'web' ? {
        backgroundColor: tc.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderWidth: 1,
        borderColor: tc.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.85)',
        boxShadow: tc.isDark
        ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
        : '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
    } as any : {
        backgroundColor: tc.isDark
        ? 'rgba(28,28,30,0.88)'
        : 'rgba(255,255,255,0.88)',
        borderWidth: 1,
        borderColor: tc.isDark
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 12,
    };

    return (
        <View style={[cardStyles.container, glassStyle]}>
            {business.logo_url && (
                <Image source={{ uri: business.logo_url }} style={cardStyles.logo} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 8 }}>
                <Text style={[cardStyles.name, { color: tc.text }]}>{business.name}</Text>
                {/* Favorito */}
                <TouchableOpacity
                    style={[cardStyles.heartBtn, { backgroundColor: tc.bgHover }]}
                    onPress={onFavorite}
                >
                    <Heart size={18} color={isBusinessFavorite ? '#ef4444' : tc.textMuted} fill={isBusinessFavorite ? '#ef4444' : 'transparent'} />
                </TouchableOpacity>
                {/* Compartir */}
                {onShare && (
                    <TouchableOpacity
                        style={[cardStyles.heartBtn, { backgroundColor: tc.bgHover }]}
                        onPress={onShare}
                    >
                        <Share2 size={18} color={tc.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
            {(business.category || business.type) && (
                <View style={cardStyles.categoryBadge}>
                    <Text style={cardStyles.categoryText}>{business.category ?? business.type}</Text>
                </View>
            )}
            {business.description ? (
                <Text style={[cardStyles.description, { color: tc.textSecondary }]}>{business.description}</Text>
            ) : null}
            <Animated.View style={[cardStyles.statusBadge, {
                opacity: isOpen ? pulseAnim : 1,
                backgroundColor: isOpen ? '#15803D' : '#DC2626',
            }]}>
                <Text style={cardStyles.statusText}>{isOpen ? '● ABIERTO' : '● CERRADO'}</Text>
            </Animated.View>
            <View style={cardStyles.separator} />
            <View style={cardStyles.ratingRow}>
                <Animated.View style={{ transform: [{ scale: starScale }] }}>
                    <Star size={18} color={colors.warning} fill={colors.warning} />
                </Animated.View>
                <Text style={[cardStyles.ratingText, { color: tc.text }]}>
                    {typeof business.rating === 'number' ? business.rating.toFixed(1) : parseFloat(String(business.rating || 0)).toFixed(1)}
                </Text>
                <Text style={[cardStyles.reviewCount, { color: tc.textMuted }]}>
                    ({(business as any).total_reviews || 0})
                </Text>
            </View>
            <View style={cardStyles.separator} />
            {scheduleList.length > 0 && (
                <View>
                    <Text style={[cardStyles.sectionLabel, { color: tc.text }]}>Horarios</Text>
                    {scheduleList.map((sched: any, i: number) => (
                        <Text key={i} style={[cardStyles.scheduleItem, { color: tc.textSecondary }]}>
                            <Text style={{ fontWeight: '700' }}>{sched.label}:</Text> {sched.text}
                        </Text>
                    ))}
                </View>
            )}
            <View style={cardStyles.separator} />
            {business.address && (
                <Pressable onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(business.address))}>
                    <View style={cardStyles.addressRow}>
                        <MapPin size={16} color={colors.primary.DEFAULT} />
                        <Text style={[cardStyles.addressText, { color: tc.textSecondary }]}>{business.address}</Text>
                    </View>
                </Pressable>
            )}
        </View>
    );
}

const cardStyles = StyleSheet.create({
    container: { borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    logo: { width: 72, height: 72, borderRadius: 16, borderWidth: 3, borderColor: '#fff', alignSelf: 'center' },
    name: { fontFamily: 'Nunito Sans', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    heartBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    categoryBadge: { alignSelf: 'center', marginTop: 6, backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    categoryText: { color: '#FF6B35', fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    description: { fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: 'center' },
    statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginTop: 8 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    ratingText: { fontFamily: 'Nunito Sans', fontSize: 16, fontWeight: '700' },
    reviewCount: { fontFamily: 'Nunito Sans', fontSize: 13 },
    sectionLabel: { fontFamily: 'Nunito Sans', fontSize: 15, fontWeight: '700', marginBottom: 8 },
    scheduleItem: { fontFamily: 'Nunito Sans', fontSize: 13, marginBottom: 4 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addressText: { fontFamily: 'Nunito Sans', fontSize: 13, flex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function BusinessDetailScreen() {
    const { slug } = useLocalSearchParams();
    const router = useRouter();
    const tc = useThemeColors();
    const { isDesktop, isMobile, productCols, maxContentWidth } = useResponsive();

    const { selectedBusiness: business, loading: loadingBusiness, fetchBusinessBySlug } = useBusinessStore();
    const { products, fetchProducts } = useProductStore();

    const [activeTab, setActiveTab] = useState('menu');
    const scrollY = useRef(new Animated.Value(0)).current;
    const { items } = useCartStore();
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const isFav = useFavoritesStore((s) => s.isFavorite);

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareComment, setShareComment] = useState('');
    const [sharing, setSharing] = useState(false);

    const submitShare = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showAlert('Iniciá sesión', 'Necesitás estar logueado para compartir');
                return;
            }
            setSharing(true);
            const localityId = useLocationStore.getState().currentLocality?.id;
            if (!localityId) {
                showAlert('Error', 'No se pudo determinar tu localidad.');
                setSharing(false);
                return;
            }
            const businessName = business?.name || 'Local';
            const businessId = business?.id || '';
            const postContent = shareComment
                ? shareComment + '\n\n[business:' + businessId + ':' + businessName + ']'
                : '[business:' + businessId + ':' + businessName + ']';

            await useSocialStore.getState().createPost(
                postContent.trim(), [], localityId
            );
            showAlert('¡Listo!', 'El local fue compartido en tu muro');
            setShareModalVisible(false);
            setShareComment('');
        } catch (err: any) {
            showAlert('Error', 'No se pudo compartir: ' + (err?.message || ''));
        } finally {
            setSharing(false);
        }
    };

    // ── Entry Card Animation ─────────────────────────────────────
    const cardAnim = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (!business?.id) return;
        cardAnim.setValue(0);
        cardSlide.setValue(30);
        Animated.parallel([
            Animated.timing(cardAnim, {
                toValue: 1, duration: 450, useNativeDriver: true
            }),
            Animated.spring(cardSlide, {
                toValue: 0, stiffness: 110, damping: 13, useNativeDriver: true
            }),
        ]).start();
    }, [business?.id]);

    // ── Product stagger animation refs ───────────────────────────
    const animRefs = useRef<{ opacity: Animated.Value; translateY: Animated.Value }[]>([]);

    useEffect(() => { if (slug) fetchBusinessBySlug(slug as string); }, [slug]);
    useEffect(() => { if (business?.id) fetchProducts(business.id); }, [business?.id]);

    useEffect(() => {
        if (!products?.length) return;
        while (animRefs.current.length < products.length) {
            animRefs.current.push({ opacity: new Animated.Value(0), translateY: new Animated.Value(20) });
        }
        products.forEach((_, index) => {
            animRefs.current[index].opacity.setValue(0);
            animRefs.current[index].translateY.setValue(20);
            Animated.parallel([
                Animated.timing(animRefs.current[index].opacity, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
                Animated.timing(animRefs.current[index].translateY, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
            ]).start();
        });
    }, [products]);

    const hoverScalesRef = useRef<Animated.Value[]>([]);
    
    // Ensure hoverScalesRef has enough items
    if (products?.length) {
        while (hoverScalesRef.current.length < products.length) {
            hoverScalesRef.current.push(new Animated.Value(1));
        }
    }

    const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const isOpen = business?.is_open && checkIsBusinessOpen(business?.schedule);
    const scheduleList = business ? getFormattedScheduleList(business.schedule) : [];
    const isBusinessFavorite = business ? isFav('business', business.id) : false;

    const handleProductPress = (product: any) => router.push(`/product/${product.id}` as any);
    const handleFavorite = () => { if (business) toggleFavorite('business', business.id); };

    if (loadingBusiness) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg }]}>
                <Skeleton height={HEADER_HEIGHT} borderRadius={0} />
                <View style={{ padding: 20 }}><Skeleton width={200} height={24} style={{ marginBottom: 10 }} /><Skeleton width={120} height={16} /></View>
            </View>
        );
    }

    if (!business) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'Nunito Sans', fontSize: 18, fontWeight: 'bold', color: tc.text }}>Negocio no encontrado</Text>
                <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: colors.primary.DEFAULT, borderRadius: 8 }} onPress={() => router.back()}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver atrás</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const heroHeight = isDesktop ? 340 : HEADER_HEIGHT;

    // ── Tabs component ───────────────────────────────────────────
    const renderTabs = () => (
        <View style={[styles.tabsContainer, { borderBottomColor: tc.borderLight }]}>
            {['menu', 'reviews', 'info'].map((tab) => (
                <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                    <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary.DEFAULT : tc.textMuted }]}>
                        {tab === 'menu' ? 'Menú' : tab === 'reviews' ? 'Reseñas' : 'Info'}
                    </Text>
                    {activeTab === tab && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
            ))}
        </View>
    );

    // ── Products grid ────────────────────────────────────────────
    const renderProducts = () => {
        if (activeTab !== 'menu') return null;
        if (products.length === 0) {
            return <View style={{ padding: 24, alignItems: 'center' }}><Text style={{ fontFamily: 'Nunito Sans', color: tc.textMuted, fontSize: 15 }}>Este negocio aún no tiene productos cargados.</Text></View>;
        }
        return (
            <View>
                <Text style={[styles.sectionTitle, { color: tc.text }]}>Destacados</Text>
                <FlatList
                    data={products}
                    scrollEnabled={false}
                    numColumns={productCols}
                    key={'products-' + productCols}
                    keyExtractor={(item) => item.id?.toString()}
                    columnWrapperStyle={productCols > 1 ? { gap: 12 } : undefined}
                    contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 120 }}
                    renderItem={({ item, index }) => {
                        const hoverScale = hoverScalesRef.current[index];
                        return (
                            <Animated.View style={{
                                flex: 1,
                                opacity: animRefs.current[index]?.opacity ?? 1,
                                transform: [{ translateY: animRefs.current[index]?.translateY ?? 0 }],
                            }}>
                                <Animated.View
                                    style={{ flex: 1, transform: [{ scale: hoverScale }] }}
                                    {...(Platform.OS === 'web' ? {
                                        onMouseEnter: () => Animated.spring(hoverScale, {
                                            toValue: 1.04, stiffness: 300, damping: 20, useNativeDriver: true
                                        }).start(),
                                        onMouseLeave: () => Animated.spring(hoverScale, {
                                            toValue: 1.0, stiffness: 300, damping: 20, useNativeDriver: true
                                        }).start(),
                                    } : {})}
                                >
                                    <ProductItem product={item} onPress={() => handleProductPress(item)} />
                                </Animated.View>
                            </Animated.View>
                        );
                    }}
                />
            </View>
        );
    };

    // ── Reviews tab ──────────────────────────────────────────────
    const renderReviews = () => activeTab !== 'reviews' ? null : (
        <View style={{ padding: 24, alignItems: 'center' }}><Text style={{ color: tc.textSecondary, fontFamily: 'Nunito Sans' }}>Reseñas del lugar</Text></View>
    );

    // ── Info tab ─────────────────────────────────────────────────
    const renderInfo = () => activeTab !== 'info' ? null : (
        <View style={{ paddingBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Ubicación</Text>
            <View style={[styles.mapContainer, { borderColor: tc.borderLight }]}>
                <BusinessMap latitude={business.latitude || 0} longitude={business.longitude || 0} name={business.name} address={business.address} />
            </View>
            {!isDesktop && (
                <>
                    <View style={styles.addressRow}><MapPin size={22} color={colors.primary.DEFAULT} /><View style={{ flex: 1 }}><Text style={[styles.addressLabel, { color: tc.text }]}>Dirección</Text><Text style={[styles.addressValue, { color: tc.textSecondary }]}>{business.address || 'No disponible'}</Text></View></View>
                    <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.sectionTitle, { color: tc.text, marginHorizontal: 0, marginTop: 0 }]}>Horarios</Text>
                        <View style={[styles.openBadge, { backgroundColor: isOpen ? colors.success : colors.danger }]}><Text style={styles.openBadgeText}>{isOpen ? 'Abierto Ahora' : 'Cerrado Ahora'}</Text></View>
                    </View>
                    <View style={styles.addressRow}><Clock size={22} color={tc.textSecondary} /><View>{scheduleList.length > 0 ? scheduleList.map((sched, i) => (<Text key={i} style={[styles.scheduleText, { color: tc.text }]}><Text style={{ fontWeight: '700' }}>{sched.label}:</Text> {sched.text}</Text>)) : (<Text style={[styles.scheduleText, { color: tc.textSecondary }]}>No hay horarios disponibles.</Text>)}</View></View>
                </>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <StatusBar barStyle="light-content" />

            <AppHeader
                title={business?.name ?? 'Local'}
                subtitle="SABOR LOCAL"
                leftIcon="back"
                rightButtons={['search', 'favorites']}
                scrollY={scrollY}
            />

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Banner */}
                <Animated.View style={[styles.heroBanner, { height: heroHeight, transform: [{ translateY: scrollY.interpolate({ inputRange: [-heroHeight, 0, heroHeight], outputRange: [heroHeight / 2, 0, -heroHeight / 3], extrapolate: 'clamp' }) }] }]}>
                    <Image source={{ uri: business.cover_url || business.logo_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
                </Animated.View>

                {/* Content wrapper */}
                <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
                    {isDesktop ? (
                        /* ══ DESKTOP: 2 columnas ══════════════════════ */
                        <View style={{ flexDirection: 'row', paddingHorizontal: 32, paddingTop: 24 }}>
                            {/* Left column — 360px sticky */}
                            <View style={{
                                width: 360, marginRight: 32,
                                ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 80, alignSelf: 'flex-start' as any, height: 'fit-content' as any } : { alignSelf: 'flex-start' as any }),
                            }}>
                                <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }] }}>
                                    <BusinessInfoCard business={business} isBusinessFavorite={isBusinessFavorite} onFavorite={handleFavorite} onShare={() => setShareModalVisible(true)} tc={tc} />
                                </Animated.View>
                            </View>
                            {/* Right column */}
                            <View style={{ flex: 1 }}>
                                {renderTabs()}
                                {renderProducts()}
                                {renderReviews()}
                                {renderInfo()}
                            </View>
                        </View>
                    ) : (
                        /* ══ MOBILE: layout original ══════════════════ */
                        <>
                            <View style={{ marginTop: -50, marginHorizontal: 12 }}>
                                <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }] }}>
                                    <BusinessInfoCard business={business} isBusinessFavorite={isBusinessFavorite} onFavorite={handleFavorite} onShare={() => setShareModalVisible(true)} tc={tc} />
                                </Animated.View>
                            </View>
                            {renderTabs()}
                            <View style={styles.content}>
                                {renderProducts()}
                                {renderReviews()}
                                {renderInfo()}
                            </View>
                        </>
                    )}
                </View>
                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* Floating Cart Button */}
            <View style={[styles.floatingCartWrapper, isDesktop && { alignItems: 'center', right: 0 }, { pointerEvents: 'box-none' }]}>
                <TouchableOpacity style={[styles.floatingCartPill, { backgroundColor: colors.primary.DEFAULT }]} activeOpacity={0.85} onPress={() => router.push('/cart' as any)}>
                    <View style={styles.iconSpacer}><ShoppingCart size={18} color="#fff" /></View>
                    <Text style={styles.floatingPillText}>Ver Mi Pedido</Text>
                    {cartCount > 0 ? (<View style={styles.floatingBadge}><Text style={styles.floatingBadgeText}>{cartCount}</Text></View>) : (<View style={styles.iconSpacer} />)}
                </TouchableOpacity>
            </View>

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
                            style={{
                                borderWidth: 1,
                                borderRadius: 14,
                                padding: 14,
                                minHeight: 80,
                                textAlignVertical: 'top',
                                fontSize: 15,
                                marginBottom: 16,
                                borderColor: tc.borderLight,
                                color: tc.text,
                                backgroundColor: tc.bg,
                            }}
                            placeholder="Agregá un comentario (opcional)..."
                            placeholderTextColor={tc.textMuted}
                            value={shareComment}
                            onChangeText={setShareComment}
                            multiline
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1, padding: 14, borderRadius: 14,
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1, borderColor: tc.borderLight,
                                }}
                                onPress={() => setShareModalVisible(false)}
                                disabled={sharing}
                            >
                                <Text style={{ color: tc.text, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1, padding: 14, borderRadius: 14,
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: '#FF6B35',
                                }}
                                onPress={submitShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
    heroBanner: { width: '100%', overflow: 'hidden' },
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 0 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
    activeTab: {},
    tabText: { fontFamily: 'Nunito Sans', fontSize: 15, fontWeight: '600' },
    activeIndicator: { position: 'absolute', bottom: 0, width: '40%', height: 3, borderRadius: 2, backgroundColor: colors.primary.DEFAULT },
    content: { minHeight: 400, paddingTop: 8 },
    sectionTitle: { fontFamily: 'Nunito Sans', fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 20, marginLeft: 16 },
    mapContainer: { height: 200, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', borderWidth: 1, marginBottom: 16 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
    addressLabel: { fontFamily: 'Nunito Sans', fontSize: 15, fontWeight: '600' },
    addressValue: { fontFamily: 'Nunito Sans', fontSize: 14, marginTop: 2 },
    divider: { height: 1, marginHorizontal: 16, marginVertical: 16 },
    scheduleText: { fontFamily: 'Nunito Sans', fontSize: 14, marginBottom: 4 },
    openBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    openBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800', fontFamily: 'Nunito Sans', textTransform: 'uppercase' },
    floatingCartWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 32 : 24, left: 16, right: 16, alignItems: 'center', zIndex: 100 },
    floatingCartPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50, borderRadius: 25, width: '100%', maxWidth: 400, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
    floatingPillText: { fontFamily: 'Nunito Sans', fontSize: 16, fontWeight: '700', color: '#fff' },
    floatingBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    floatingBadgeText: { fontFamily: 'Nunito Sans', fontSize: 13, fontWeight: '800', color: '#fff' },
    iconSpacer: { width: 26, alignItems: 'center', justifyContent: 'center' },
});
