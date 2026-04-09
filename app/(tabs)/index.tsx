// Home Screen — Header con búsqueda inline, hamburger mobile, pin premium y DM modal
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet, ScrollView, View, RefreshControl, useWindowDimensions,
    TextInput, TouchableOpacity, Text, Modal, FlatList, Image, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin } from 'lucide-react-native';
import { StoriesRail, CategoriesGrid, BusinessFeed } from '../../components/home';
import { AdBanner } from '../../components/features/ads/AdBanner';
import { FeaturedSection } from '../../components/features/home/FeaturedSection';
import { NewInTown } from '../../components/features/home/NewInTown';
import { SocialPreview } from '../../components/features/home/SocialPreview';
import colors from '../../constants/colors';
import { useLocationStore, Locality } from '../../stores/locationStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRouter } from 'expo-router';
import { showAlert } from '../../utils/alert';
import { openMobileDrawer } from './_layout';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { Business } from '../../stores/businessStore';

// ── Fallback locality ────────────────────────────────────────────
const FALLBACK_LOCALITY_ID = 'f8b76cc2-4df3-4b9f-846f-08586b1ee3c3'; // Río Colorado

// ── Business formatter (same as useMarketplaceData) ──────────────
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


export default function HomeScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { currentLocality, availableLocalities, setCurrentLocality } = useLocationStore();
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Scroll Animation
    const scrollY = useRef(new Animated.Value(0)).current;

    // Location picker
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);

    // ── Real data states ─────────────────────────────────────────
    const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
    const [newBusinesses, setNewBusinesses] = useState<Business[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [loadingNew, setLoadingNew] = useState(true);

    // ── Fetch real data from Supabase ────────────────────────────
    const fetchHomeData = useCallback(async () => {
        const localityId = currentLocality?.id || FALLBACK_LOCALITY_ID;

        setLoadingFeatured(true);
        setLoadingNew(true);

        try {
            // First get the region_id for this locality
            const { data: localityData } = await supabase
                .from('localities')
                .select('region_id')
                .eq('id', localityId)
                .single();

            const regionId = localityData?.region_id;

            // Build base query — if we have region_id, get all businesses in region
            // Otherwise fall back to just the locality
            const buildQuery = () => {
                let query = supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true);

                if (regionId) {
                    // Get all localities in this region, then filter businesses
                    // Since Supabase doesn't support subqueries easily,
                    // we'll use a two-step approach
                    return { query, regionId };
                }
                return { query: query.eq('locality_id', localityId), regionId: null };
            };

            const { regionId: resolvedRegionId } = buildQuery();

            let localityIds: string[] = [localityId];

            if (resolvedRegionId) {
                const { data: regionLocalities } = await supabase
                    .from('localities')
                    .select('id')
                    .eq('region_id', resolvedRegionId);
                if (regionLocalities && regionLocalities.length > 0) {
                    localityIds = regionLocalities.map((l: any) => l.id);
                }
            }

            // Fetch both in parallel
            const [featuredResult, newResult] = await Promise.all([
                // Destacados: best rated
                supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true)
                    .in('locality_id', localityIds)
                    .order('rating', { ascending: false, nullsFirst: false })
                    .limit(10),

                // Nuevo en zona: most recent
                supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true)
                    .in('locality_id', localityIds)
                    .order('created_at', { ascending: false })
                    .limit(8),
            ]);

            if (featuredResult.data) {
                setFeaturedBusinesses(featuredResult.data.map(formatBusiness));
            }
            if (newResult.data) {
                setNewBusinesses(newResult.data.map(formatBusiness));
            }
        } catch (err) {
            console.error('[Home] Error fetching home data:', err);
        } finally {
            setLoadingFeatured(false);
            setLoadingNew(false);
        }
    }, [currentLocality?.id]);

    useEffect(() => {
        fetchHomeData();
    }, [fetchHomeData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHomeData().finally(() => setRefreshing(false));
    }, [fetchHomeData]);



    const handleSearchSubmit = (query?: string) => {
        if (query) {
            router.push(`/search?q=${encodeURIComponent(query)}` as any);
        }
    };

    const handleSelectLocality = (locality: Locality) => {
        setCurrentLocality(locality);
        setLocationPickerVisible(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader
                subtitle="UN PIQUE"
                title="Inicio"
                leftIcon="menu"
                rightButtons={['search', 'favorites', 'notifications', 'cart']}
                onSearchSubmit={handleSearchSubmit}
                searchPlaceholder="Buscar negocios, servicios..."
                scrollY={scrollY}
            />



            <Animated.ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false } // box-shadow / border changes cannot use true native driver
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.maxContainer, isDesktop && { maxWidth: 1200 }]}>
                    <View style={styles.sectionSpacer}><StoriesRail /></View>
                    <AdBanner />
                    <CategoriesGrid />
                    <FeaturedSection businesses={featuredBusinesses} loading={loadingFeatured} />
                    <NewInTown businesses={newBusinesses} loading={loadingNew} />
                    <SocialPreview />
                    <BusinessFeed />
                </View>
            </Animated.ScrollView>



            {/* LOCATION PICKER MODAL */}
            <Modal visible={locationPickerVisible} transparent animationType="fade" onRequestClose={() => setLocationPickerVisible(false)}>
                <View style={styles.locationModalOverlay}>
                    <TouchableOpacity style={styles.locationModalBg} activeOpacity={1} onPress={() => setLocationPickerVisible(false)} />
                    <View style={[styles.locationPanel, { backgroundColor: tc.bgCard }]}>
                        <View style={[styles.locationHeader, { borderBottomColor: tc.borderLight }]}>
                            <Text style={[styles.locationTitle, { color: tc.text }]}>Elegí tu ubicación</Text>
                            <TouchableOpacity onPress={() => setLocationPickerVisible(false)}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {availableLocalities.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[
                                        styles.locationItem,
                                        currentLocality?.id === loc.id && { backgroundColor: tc.bgHover },
                                    ]}
                                    onPress={() => handleSelectLocality(loc)}
                                >
                                    <MapPin size={18} color={currentLocality?.id === loc.id ? colors.primary.DEFAULT : tc.textSecondary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.locationName, { color: tc.text }, currentLocality?.id === loc.id && { color: colors.primary.DEFAULT, fontWeight: '700' }]}>{loc.name}</Text>
                                        <Text style={[styles.locationSub, { color: tc.textMuted }]}>{loc.province}</Text>
                                    </View>
                                    {currentLocality?.id === loc.id && (
                                        <View style={[styles.locationCheck, { backgroundColor: colors.primary.DEFAULT }]}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {availableLocalities.length === 0 && (
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <Text style={[{ color: tc.textMuted, fontSize: 14 }]}>No hay localidades disponibles</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, zIndex: 100 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hamburgerBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    // Premium Pin
    pinTouchable: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pinOuter: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(255,107,53,0.3), inset 0 1px 2px rgba(255,255,255,0.15)' } : {}),
    },
    pinInner: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center', alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.45)' } : {}),
    },
    headerSubtitle: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    headerTitle: { fontSize: 15, fontWeight: '800' },
    // Search
    searchWrapper: { flex: 1, position: 'relative', zIndex: 200 },
    headerSearchBar: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 18, paddingHorizontal: 12, gap: 6, overflow: 'hidden' },
    headerSearchInput: { flex: 1, fontSize: 13, height: '100%', paddingVertical: 0, minWidth: 0 },
    searchDropdown: {
        position: 'absolute', top: 42, left: 0, right: 0, borderRadius: 14, borderWidth: 1, maxHeight: 320, overflow: 'hidden',
        ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' } : {}),
    },
    searchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    searchItemImg: { width: 40, height: 40, borderRadius: 10 },
    searchItemName: { fontSize: 14, fontWeight: '600' },
    searchItemType: { fontSize: 11, marginTop: 1 },
    noResultsRow: { padding: 20, alignItems: 'center' },
    noResultsText: { fontSize: 13 },
    searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
    // Actions
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    headerBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5 },
    // Content
    content: { flex: 1 },
    scrollContent: { paddingBottom: 100, alignItems: 'center' },
    maxContainer: { width: '100%', maxWidth: 1024 },
    sectionSpacer: { marginTop: 8 },
    // DM
    dmOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    dmOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    dmPanel: { width: '85%', maxWidth: 360, height: '100%' },
    dmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    dmTitle: { fontSize: 18, fontWeight: '800' },
    dmList: { padding: 0 },
    dmItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 0.5 },
    dmAvatar: { width: 48, height: 48, borderRadius: 24 },
    dmName: { fontSize: 15, fontWeight: '700' },
    dmLastMsg: { fontSize: 13, marginTop: 2 },
    dmTime: { fontSize: 11 },
    // Location Picker
    locationModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    locationModalBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    locationPanel: { width: '90%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
    locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
    locationTitle: { fontSize: 18, fontWeight: '800' },
    locationItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    locationName: { fontSize: 15, fontWeight: '500' },
    locationSub: { fontSize: 12, marginTop: 1 },
    locationCheck: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
