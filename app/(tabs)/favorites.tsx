import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl,
    Pressable, Platform, Animated, Image, useWindowDimensions, TouchableOpacity
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Heart, Store, ShoppingBag, Wrench, Home, ChevronLeft, ChevronRight,
    MapPin, Clock, MessageCircle, Star
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { supabase } from '../../lib/supabase';
import { Business } from '../../stores/businessStore';
import { MarketplaceProduct } from '../../hooks/useMarketplaceData';
import { Listing } from '../../stores/listingStore';
import { useResponsive } from '../../hooks/useResponsive';

// ─── Formatters ───────────────────────────────────────────────────
const formatBusiness = (b: any): Business => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    address: b.address || '',
    rating: b.rating || 0,
    delivery_time: '30-45 min',
    min_order: b.min_order_amount || 0,
    delivery_fee: b.delivery_fee || 0,
    image: b.logo_url || b.cover_url || 'https://via.placeholder.com/300',
    tags: b.tags || [],
    is_open: b.is_open,
    locality_id: b.locality_id,
    category: b.category,
    logo_url: b.logo_url,
    cover_url: b.cover_url,
    slug: b.slug,
    phone: b.phone,
    website: b.website,
    schedule: b.business_hours,
    has_delivery: b.has_delivery,
    has_pickup: b.has_pickup,
    accepts_cash: Array.isArray(b.payment_methods) ? b.payment_methods.includes('cash') : false,
    accepts_mercadopago: Array.isArray(b.payment_methods) ? b.payment_methods.includes('mercadopago') : false,
    mercadopago_connected: b.mercadopago_connected || false,
    delivery_radius: b.delivery_radius_km,
});

const formatProduct = (p: any): MarketplaceProduct => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    image_url: p.image_url,
    is_available: p.is_available !== false,
    total_sold: p.total_sold || 0,
    business_id: p.business_id,
    business_name: p.businesses?.name || '',
    business_slug: p.businesses?.slug,
});

type TabType = 'negocios' | 'productos' | 'servicios' | 'alojamientos';

const FavoriteCard = ({
    item,
    type,
    index,
    onRemove,
    tc,
    isDesktop,
    listAnim
}: {
    item: any;
    type: 'business' | 'product' | 'listing' | 'accommodation';
    index: number;
    onRemove: (type: any, id: string) => void;
    tc: any;
    isDesktop: boolean;
    listAnim: Animated.Value;
}) => {
    const router = useRouter();
    
    useEffect(() => {
        Animated.timing(listAnim, {
            toValue: 1,
            duration: 250,
            delay: index * 50,
            useNativeDriver: true
        }).start();
    }, []);

    const translateY = listAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0]
    });

    const isRemoval = useRef(new Animated.Value(0)).current;
    const handleHeartPress = () => {
        Animated.sequence([
            Animated.timing(isRemoval, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(isRemoval, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start(() => {
            onRemove(type, item.id);
        });
    };

    const cardStyle: any = [
        styles.card,
        { 
            backgroundColor: tc.bgCard, 
            borderColor: tc.borderLight,
            opacity: listAnim, 
            transform: [
                { translateY }, 
                { scale: isRemoval.interpolate({ inputRange: [0, 1, 1.3], outputRange: [1, 1, 1.3] }) }
            ] 
        },
        isDesktop && { width: type === 'accommodation' ? '31%' : '48%' }
    ];

    if (type === 'business') {
        const biz = item as Business;
        return (
            <Animated.View style={cardStyle}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    style={styles.cardRow}
                    onPress={() => router.push(`/shop/${biz.slug}` as any)}
                >
                    <View style={[styles.logoContainer, { backgroundColor: tc.bgInput }]}>
                        {biz.logo_url ? (
                            <Image source={{ uri: biz.logo_url }} style={styles.logo} />
                        ) : (
                            <Text style={styles.logoPlaceholder}>{biz.name.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: tc.text }]} numberOfLines={1}>{biz.name}</Text>
                        <Text style={[styles.cardSub, { color: tc.textSecondary }]} numberOfLines={1}>{biz.category}</Text>
                        <View style={styles.cardMeta}>
                            {biz.delivery_fee > 0 && (
                                <Text style={[styles.metaText, { color: tc.textSecondary }]}>🛵 Envío ${biz.delivery_fee}</Text>
                            )}
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: biz.is_open ? '#22C55E' : '#EF4444' }]} />
                                <Text style={[styles.metaText, { color: tc.textSecondary }]}>{biz.is_open ? 'Abierto' : 'Cerrado'}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleHeartPress} style={styles.heartBtn}>
                        <Heart size={20} color="#EF4444" fill="#EF4444" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    if (type === 'product') {
        const prod = item as MarketplaceProduct;
        return (
            <Animated.View style={cardStyle}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    style={styles.cardRow}
                    onPress={() => router.push(`/product/${prod.id}` as any)}
                >
                    <View style={[styles.imageContainer, { backgroundColor: tc.bgInput }]}>
                        {prod.image_url ? (
                            <Image source={{ uri: prod.image_url }} style={styles.cardImage} />
                        ) : (
                            <ShoppingBag size={24} color={tc.textSecondary} />
                        )}
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: tc.text }]} numberOfLines={1}>{prod.name}</Text>
                        <Text style={[styles.cardSub, { color: tc.textSecondary }]} numberOfLines={1}>{prod.business_name}</Text>
                        <Text style={[styles.price, { color: '#FF6B35' }]}>${prod.price}</Text>
                    </View>
                    <TouchableOpacity onPress={handleHeartPress} style={styles.heartBtn}>
                        <Heart size={20} color="#EF4444" fill="#EF4444" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    if (type === 'listing') {
        const srv = item as Listing;
        return (
            <Animated.View style={cardStyle}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    style={styles.cardRow}
                    onPress={() => router.push(`/directory/${srv.id}` as any)}
                >
                    <View style={[styles.avatarContainer, { backgroundColor: tc.bgInput }]}>
                        {srv.owner_avatar ? (
                            <Image source={{ uri: srv.owner_avatar }} style={styles.avatar} />
                        ) : (
                            <Wrench size={24} color={tc.textSecondary} />
                        )}
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: tc.text }]} numberOfLines={1}>{srv.title}</Text>
                        <Text style={[styles.cardSub, { color: tc.textSecondary }]} numberOfLines={1}>{srv.owner_name || 'Proveedor'}</Text>
                        <Text style={[styles.specialty, { color: '#FF6B35' }]}>{srv.category}</Text>
                    </View>
                    <TouchableOpacity onPress={handleHeartPress} style={styles.heartBtn}>
                        <Heart size={20} color="#EF4444" fill="#EF4444" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    if (type === 'accommodation') {
        const acc = item as Listing;
        return (
            <Animated.View style={[cardStyle, { padding: 0, overflow: 'hidden' }]}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => router.push(`/alojamiento` as any)}
                >
                    <View style={styles.accHeader}>
                        {acc.images?.[0] ? (
                            <Image source={{ uri: acc.images[0] }} style={styles.accImage} />
                        ) : (
                            <View style={[styles.accImagePlaceholder, { backgroundColor: tc.bgInput }]}>
                                <Home size={32} color={tc.textSecondary} />
                            </View>
                        )}
                    </View>
                    <View style={styles.accBody}>
                        <View style={styles.accTitleRow}>
                            <Text style={[styles.cardTitle, { color: tc.text, flex: 1 }]} numberOfLines={1}>{acc.title}</Text>
                            <TouchableOpacity onPress={handleHeartPress} style={styles.heartBtnAcc}>
                                <Heart size={20} color="#EF4444" fill="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.cardSub, { color: tc.textSecondary, marginTop: 2 }]}>{acc.accommodation_type || acc.category}</Text>
                        <View style={styles.accMeta}>
                            <Text style={[styles.metaText, { color: tc.textSecondary }]}>💰 Consultar</Text>
                            {acc.max_guests && (
                                <Text style={[styles.metaText, { color: tc.textSecondary }]}>👥 {acc.max_guests} personas</Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return null;
};

export default function FavoritesScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { user } = useAuthStore();
    const { isDesktop } = useResponsive();
    const insets = useSafeAreaInsets();
    const { 
        businessIds, productIds, listingIds, accommodationIds,
        loading: loadingFavs, fetchFavorites, tableExists, 
        clearNewFavoritesCount, toggleFavorite 
    } = useFavoritesStore();

    const [activeTab, setActiveTab] = useState<TabType>('negocios');
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [services, setServices] = useState<Listing[]>([]);
    const [accommodations, setAccommodations] = useState<Listing[]>([]);
    
    const [loadingData, setLoadingData] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ── Animations ───────────────────────────────────────────────
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const contentScale = useRef(new Animated.Value(1)).current;
    const listAnims = useRef<Record<string, Animated.Value>>({}).current;

    const animateTabChange = useCallback(() => {
        contentOpacity.setValue(1);
        contentScale.setValue(1);
        Animated.parallel([
            Animated.sequence([
                Animated.timing(contentOpacity, { toValue: 0, duration: 75, useNativeDriver: true }),
                Animated.timing(contentOpacity, { toValue: 1, duration: 75, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(contentScale, { toValue: 0.97, duration: 75, useNativeDriver: true }),
                Animated.timing(contentScale, { toValue: 1, duration: 75, useNativeDriver: true }),
            ])
        ]).start();
    }, [contentOpacity, contentScale]);

    useEffect(() => {
        animateTabChange();
    }, [activeTab]);

    const getListAnim = (id: string) => {
        if (!listAnims[id]) {
            listAnims[id] = new Animated.Value(0);
        }
        return listAnims[id];
    };

    // ── Data Fetching ────────────────────────────────────────────
    const fetchFavBusinesses = useCallback(async () => {
        if (businessIds.length === 0) { setBusinesses([]); return; }
        const { data, error } = await supabase.from('businesses').select('*').in('id', businessIds);
        if (!error && data) setBusinesses(data.map(formatBusiness));
    }, [businessIds]);

    const fetchFavProducts = useCallback(async () => {
        if (productIds.length === 0) { setProducts([]); return; }
        const { data, error } = await supabase.from('products').select('*, businesses!inner(name, slug)').in('id', productIds);
        if (!error && data) setProducts(data.map(formatProduct));
    }, [productIds]);

    const fetchFavListings = useCallback(async () => {
        const allListingIds = Array.from(new Set([...(listingIds || []), ...(accommodationIds || [])]));
        if (allListingIds.length === 0) { setServices([]); setAccommodations([]); return; }
        
        const { data, error } = await supabase.from('listings').select('*').in('id', allListingIds);
        if (!error && data) {
            const list = data as any[];
            setServices(list.filter(l => l.type === 'service'));
            setAccommodations(list.filter(l => l.type === 'accommodation'));
        }
    }, [listingIds, accommodationIds]);

    const loadAll = useCallback(async () => {
        setLoadingData(true);
        await Promise.all([fetchFavBusinesses(), fetchFavProducts(), fetchFavListings()]);
        setLoadingData(false);
    }, [fetchFavBusinesses, fetchFavProducts, fetchFavListings]);

    useEffect(() => {
        if (user) {
            clearNewFavoritesCount();
            fetchFavorites();
        }
    }, [user]);

    useEffect(() => {
        if (user) loadAll();
    }, [businessIds, productIds, listingIds, accommodationIds, user]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFavorites();
        setRefreshing(false);
    };

    const handleRemove = async (type: any, id: string) => {
        // Animation out
        Animated.timing(getListAnim(id), {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
        }).start(async () => {
            await toggleFavorite(type, id);
        });
    };

    // ── Render Helpers ───────────────────────────────────────────

    const renderEmpty = () => {
        let icon = Store;
        let title = "";
        let sub = "Explorá la app y guardá lo que más te guste";

        if (activeTab === 'negocios') { icon = Store; title = "No tenés negocios guardados"; }
        else if (activeTab === 'productos') { icon = ShoppingBag; title = "No tenés productos guardados"; }
        else if (activeTab === 'servicios') { icon = Wrench; title = "No tenés servicios guardados"; }
        else if (activeTab === 'alojamientos') { icon = Home; title = "No tenés alojamientos guardados"; }

        const IconComp = icon as any;

        return (
            <View style={styles.emptyContainer}>
                <IconComp size={64} color={tc.borderLight} />
                <Text style={[styles.emptyTitle, { color: tc.text }]}>{title}</Text>
                <Text style={[styles.emptySub, { color: tc.textSecondary }]}>{sub}</Text>
            </View>
        );
    };

    // ── Main UI ──────────────────────────────────────────────────
    if (!user) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: tc.bg }]} edges={['top']}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 }}>
                    <TouchableOpacity
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                        style={{ marginRight: 12, padding: 4 }}
                        activeOpacity={0.7}>
                        <ChevronLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerPre, { color: tc.textSecondary }]}>MIS FAVORITOS</Text>
                        <Text style={[styles.headerTitleMain, { color: tc.text }]}>Guardados</Text>
                    </View>
                </View>
                <View style={styles.centerContent}>
                    <Heart size={48} color={tc.textMuted} />
                    <Text style={[styles.emptyTitle, { color: tc.text }]}>Iniciá sesión</Text>
                    <Text style={[styles.emptySub, { color: tc.textSecondary, textAlign: 'center' }]}>
                        Para ver tus favoritos tenés que estar logueado.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.loginBtn, { backgroundColor: '#FF6B35' }]}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const counts = {
        negocios: businessIds.length,
        productos: productIds.length,
        servicios: services.length,
        alojamientos: accommodations.length,
    };

    const currentList = activeTab === 'negocios' ? businesses : 
                        activeTab === 'productos' ? products : 
                        activeTab === 'servicios' ? services : accommodations;

    const isLoading = loadingFavs || loadingData;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 }}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    style={{ marginRight: 12, padding: 4 }}
                    activeOpacity={0.7}>
                    <ChevronLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerPre, { color: tc.textSecondary }]}>MIS FAVORITOS</Text>
                    <Text style={[styles.headerTitleMain, { color: tc.text }]}>Guardados</Text>
                </View>
            </View>

            {/* Tabs */}
            <View>
                <ScrollView 
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.tabsScroll, isDesktop && { justifyContent: 'flex-start', paddingHorizontal: 20 }]}
                >
                    {(['negocios', 'productos', 'servicios', 'alojamientos'] as TabType[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            activeOpacity={0.7}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tabPill,
                                { backgroundColor: activeTab === tab ? '#FF6B35' : tc.bgInput },
                                !isDesktop && { paddingHorizontal: 12, paddingVertical: 6 },
                                isDesktop && { marginRight: 12 }
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? '#fff' : tc.textSecondary },
                                !isDesktop && { fontSize: 13 }
                            ]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)} {counts[tab] > 0 ? `(${counts[tab]})` : ''}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {isLoading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                </View>
            ) : (
                <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ scale: contentScale }] }}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />}
                        showsVerticalScrollIndicator={false}
                    >
                        {currentList.length > 0 ? (
                            <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
                                {currentList.map((item, index) => (
                                    <FavoriteCard
                                        key={item.id}
                                        item={item}
                                        type={activeTab === 'negocios' ? 'business' : activeTab === 'productos' ? 'product' : activeTab === 'servicios' ? 'listing' : 'accommodation'}
                                        index={index}
                                        onRemove={handleRemove}
                                        tc={tc}
                                        isDesktop={isDesktop}
                                        listAnim={getListAnim(item.id)}
                                    />
                                ))}
                            </View>
                        ) : renderEmpty()}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
    headerPre: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
    headerTitleMain: { fontSize: 26, fontWeight: 'bold' },
    
    tabsScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
    tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    tabText: { fontSize: 14, fontWeight: '600' },
    
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    
    grid: { paddingHorizontal: 16 },
    desktopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
    
    card: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    
    logoContainer: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logo: { width: '100%', height: '100%' },
    logoPlaceholder: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
    
    imageContainer: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%' },
    
    avatarContainer: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold' },
    cardSub: { fontSize: 13, marginTop: 2 },
    cardMeta: { flexDirection: 'row', marginTop: 6, gap: 12, alignItems: 'center' },
    metaText: { fontSize: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    
    price: { fontSize: 15, fontWeight: '600', marginTop: 6 },
    specialty: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    
    heartBtn: { padding: 4 },
    
    // Accommodation specifics
    accHeader: { width: '100%', height: 120 },
    accImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    accImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    accBody: { padding: 12 },
    accTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heartBtnAcc: { padding: 2 },
    accMeta: { flexDirection: 'row', marginTop: 8, gap: 16 },

    emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center' },
    
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loginBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
