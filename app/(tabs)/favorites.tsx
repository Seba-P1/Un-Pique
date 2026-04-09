// Favorites Screen — Tabs Negocios/Productos con datos reales de Supabase
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { AppHeader } from '../../components/ui/AppHeader';
import { BusinessCardCompact } from '../../components/delivery/BusinessCardCompact';
import { ProductCard } from '../../components/delivery/ProductCard';
import { supabase } from '../../lib/supabase';
import { Business } from '../../stores/businessStore';
import { MarketplaceProduct } from '../../hooks/useMarketplaceData';

// ── Business formatter ───────────────────────────────────────────
const formatBusiness = (b: any): Business => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    address: b.address || '',
    rating: b.rating || 0,
    delivery_time: '30-45 min',
    min_order: b.min_order_amount || 0,
    delivery_fee: b.delivery_fee || 0,
    image: b.cover_url || b.logo_url || 'https://via.placeholder.com/300',
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

type TabType = 'negocios' | 'productos' | 'servicios';

export default function FavoritesScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { user } = useAuthStore();
    const { businessIds, productIds, listingIds, loading: loadingFavs, fetchFavorites, tableExists, clearNewFavoritesCount } = useFavoritesStore();

    const [activeTab, setActiveTab] = useState<TabType>('negocios');
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ── Fetch businesses by IDs ──────────────────────────────────
    const fetchFavBusinesses = useCallback(async () => {
        if (businessIds.length === 0) {
            setBusinesses([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .in('id', businessIds);
            if (error) throw error;
            setBusinesses((data || []).map(formatBusiness));
        } catch (err) {
            console.error('[Favorites] Error fetching businesses:', err);
        }
    }, [businessIds]);

    // ── Fetch products by IDs ────────────────────────────────────
    const fetchFavProducts = useCallback(async () => {
        if (productIds.length === 0) {
            setProducts([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, businesses!inner(name, slug)')
                .in('id', productIds);
            if (error) throw error;
            setProducts((data || []).map(formatProduct));
        } catch (err) {
            console.error('[Favorites] Error fetching products:', err);
        }
    }, [productIds]);

    // ── Fetch services by IDs ────────────────────────────────────
    const fetchFavServices = useCallback(async () => {
        if (listingIds?.length === 0 || !listingIds) {
            setServices([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .in('id', listingIds);
            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            console.error('[Favorites] Error fetching services:', err);
        }
    }, [listingIds]);

    // ── Load data when IDs change ────────────────────────────────
    useEffect(() => {
        setLoadingData(true);
        Promise.all([fetchFavBusinesses(), fetchFavProducts(), fetchFavServices()])
            .finally(() => setLoadingData(false));
    }, [fetchFavBusinesses, fetchFavProducts, fetchFavServices]);

    // ── Fetch favorites on mount ─────────────────────────────────
    useEffect(() => {
        clearNewFavoritesCount();
        if (user) fetchFavorites();
    }, [user]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFavorites();
        setRefreshing(false);
    };

    // ── Not authenticated ────────────────────────────────────────
    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Guardados" subtitle="MIS FAVORITOS" leftIcon="back" />
                <View style={styles.centerContent}>
                    <Heart size={48} color={tc.textMuted} />
                    <Text style={[styles.emptyTitle, { color: tc.text }]}>Iniciá sesión</Text>
                    <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                        Para ver tus favoritos tenés que estar logueado.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Table doesn't exist ──────────────────────────────────────
    if (tableExists === false) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Guardados" subtitle="MIS FAVORITOS" leftIcon="back" />
                <View style={styles.centerContent}>
                    <Heart size={48} color={tc.textMuted} />
                    <Text style={[styles.emptyTitle, { color: tc.text }]}>Favoritos disponibles próximamente</Text>
                    <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                        Estamos preparando esta funcionalidad para vos.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const isLoading = loadingFavs || loadingData;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Guardados" subtitle="MIS FAVORITOS" leftIcon="back" />

            {/* ── Tab Pills ─────────────────────────────────────── */}
            <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.tabsContainer, { paddingRight: 16 }]}
                style={{ borderBottomWidth: 1, borderBottomColor: tc.borderLight }}
            >
                <Pressable
                    style={[
                        styles.tabPill,
                        activeTab === 'negocios' && [styles.tabPillActive, { backgroundColor: '#FF6B35' }],
                        activeTab !== 'negocios' && { backgroundColor: tc.bgHover },
                    ]}
                    onPress={() => setActiveTab('negocios')}
                >
                    <Text style={[
                        styles.tabPillText,
                        { color: activeTab === 'negocios' ? '#fff' : tc.textSecondary },
                    ]}>
                        Negocios {businessIds.length > 0 ? `(${businessIds.length})` : ''}
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.tabPill,
                        activeTab === 'productos' && [styles.tabPillActive, { backgroundColor: '#FF6B35' }],
                        activeTab !== 'productos' && { backgroundColor: tc.bgHover },
                    ]}
                    onPress={() => setActiveTab('productos')}
                >
                    <Text style={[
                        styles.tabPillText,
                        { color: activeTab === 'productos' ? '#fff' : tc.textSecondary },
                    ]}>
                        Productos {productIds.length > 0 ? `(${productIds.length})` : ''}
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.tabPill,
                        activeTab === 'servicios' && [styles.tabPillActive, { backgroundColor: '#FF6B35' }],
                        activeTab !== 'servicios' && { backgroundColor: tc.bgHover },
                    ]}
                    onPress={() => setActiveTab('servicios')}
                >
                    <Text style={[
                        styles.tabPillText,
                        { color: activeTab === 'servicios' ? '#fff' : tc.textSecondary },
                    ]}>
                        Servicios {(listingIds && listingIds.length > 0) ? `(${listingIds.length})` : ''}
                    </Text>
                </Pressable>
            </ScrollView>

            {/* ── Content ──────────────────────────────────────── */}
            {isLoading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={tc.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tc.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'negocios' && (
                        businesses.length > 0 ? (
                            <View style={[styles.listContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                {businesses.map((biz) => (
                                    <BusinessCardCompact key={biz.id} business={biz} />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                    <Heart size={40} color="#ef4444" />
                                </View>
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin favoritos aún</Text>
                                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                    Dale corazón a los negocios que más te gusten para tenerlos siempre a mano.
                                </Text>
                            </View>
                        )
                    )}

                    {activeTab === 'productos' && (
                        products.length > 0 ? (
                            <View style={styles.productsGrid}>
                                {products.map((prod) => (
                                    <ProductCard key={prod.id} product={prod} variant="grid" />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                    <Heart size={40} color="#ef4444" />
                                </View>
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin productos favoritos</Text>
                                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                    Marcá los productos que te gustan para encontrarlos rápidamente.
                                </Text>
                            </View>
                        )
                    )}

                    {activeTab === 'servicios' && (
                        services.length > 0 ? (
                            <View style={styles.servicesContainer}>
                                {services.map((srv) => (
                                    <Pressable 
                                        key={srv.id} 
                                        style={[styles.serviceCard, { backgroundColor: tc.bgCard }]}
                                        onPress={() => router.push(`/directory/${srv.id}` as any)}
                                    >
                                        <Text style={[styles.serviceTitle, { color: tc.text }]}>{srv.title || srv.name}</Text>
                                        <Text style={[styles.serviceCat, { color: tc.textMuted }]}>{srv.category || 'Servicio'}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                    <Bookmark size={40} color="#ef4444" />
                                </View>
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin servicios guardados aún</Text>
                                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                    Guardá los servicios de las personas que más confianza te dan.
                                </Text>
                            </View>
                        )
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    tabPill: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tabPillActive: {},
    tabPillText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        paddingTop: 16,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    servicesContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    serviceCard: {
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    serviceTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    serviceCat: {
        fontSize: 13,
    },
});
