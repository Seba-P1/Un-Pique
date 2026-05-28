import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Platform,
    Animated,
    ImageBackground,
    Pressable,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UtensilsCrossed, PackageSearch } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { CategoriesGrid, BusinessCardWide, ProductCard, SectionHeader, BusinessCardCompact } from '../../../components/delivery';
import { useLocationStore } from '../../../stores/locationStore';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useCartStore } from '../../../stores/cartStore';
import { AppHeader } from '../../../components/ui/AppHeader';
import { useMarketplaceData, MarketplaceProduct } from '../../../hooks/useMarketplaceData';
import { Business } from '../../../stores/businessStore';
import { useResponsive } from '../../../hooks/useResponsive';

// ─── ProductCardCinematic ────────────────────────────────────────
interface ProductCardCinematicProps {
    item: any;
    index: number;
    onPress: () => void;
    cardWidth?: number;
}

function ProductCardCinematic({ item, index, onPress, cardWidth }: ProductCardCinematicProps) {
    const w = cardWidth ?? 160;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Taste-Skill — micro-animación de entrada de la pill:
    const pillAnim = useRef(new Animated.Value(0)).current;
    const pillScale = useRef(new Animated.Value(0.88)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1, duration: 350,
                delay: index * 80, useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
                toValue: 0, duration: 350,
                delay: index * 80, useNativeDriver: true,
            }),
            // Disparar después del entry stagger de la tarjeta
            Animated.timing(pillAnim, {
                toValue: 1,
                duration: 300,
                delay: index * 80 + 200,
                useNativeDriver: true,
            }),
            Animated.spring(pillScale, {
                toValue: 1,
                stiffness: 180,
                damping: 14,
                delay: index * 80 + 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96, stiffness: 200, damping: 15, useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1, stiffness: 200, damping: 15, useNativeDriver: true,
        }).start();
    };

    const imageUri = item.image_url ?? item.image ?? item.photo_url;

    const contentBlock = (
        <Animated.View style={{
            opacity: pillAnim,
            transform: [{ scale: pillScale }],
            position: 'absolute',
            bottom: 10,
            left: 8,
            right: 8,
        }}>
            <View style={{
                // Liquid Glass Refraction (Taste-Skill):
                ...(Platform.OS === 'web' ? {
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.3)',
                } as any : {
                    backgroundColor: 'rgba(0,0,0,0.52)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                }),
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
            }}>
                <Text style={cinematicStyles.title} numberOfLines={2}>
                    {item.name ?? item.title}
                </Text>
                {(item.business_name || item.business?.name) ? (
                    <Text style={cinematicStyles.business} numberOfLines={1}>
                        {item.business_name ?? item.business?.name}
                    </Text>
                ) : null}
                <Text style={cinematicStyles.price}>
                    ${item.price ?? item.precio ?? ''}
                </Text>
            </View>
        </Animated.View>
    );

    return (
        <Animated.View style={{
            opacity: opacityAnim,
            transform: [{ translateY: translateAnim }, { scale: scaleAnim }],
        }}>
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
                <View style={{ width: w, height: 210, borderRadius: 20, overflow: 'hidden' }}>
                    {imageUri ? (
                        <ImageBackground
                            source={{ uri: imageUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        >
                            {contentBlock}
                        </ImageBackground>
                    ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
                            {contentBlock}
                        </View>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const cinematicStyles = StyleSheet.create({
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    business: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    price: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FF6B35',
        textAlign: 'center',
        marginTop: 3,
    },
});

// ─── Horizontal Business List (mobile) ──────────────────────────
function BusinessHorizontalList({ data, loading }: { data: Business[]; loading: boolean }) {
    const tc = useThemeColors();
    if (loading) {
        return <View style={styles.sectionLoading}><ActivityIndicator size="small" color={tc.primary} /></View>;
    }
    return (
        <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
                <BusinessCardWide business={item} />
            )}
        />
    );
}

// ─── Grid Business List (desktop) ───────────────────────────────
function BusinessGridList({ data, loading, numColumns }: { data: Business[]; loading: boolean; numColumns: number }) {
    const tc = useThemeColors();
    if (loading) {
        return <View style={styles.sectionLoading}><ActivityIndicator size="small" color={tc.primary} /></View>;
    }
    return (
        <FlatList
            data={data}
            scrollEnabled={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={numColumns}
            key={'biz-' + numColumns}
            columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                    <BusinessCardWide business={item} />
                </View>
            )}
        />
    );
}

// ─── Horizontal Product List (mobile) ────────────────────────────
function ProductHorizontalList({ data, loading }: { data: MarketplaceProduct[]; loading: boolean }) {
    const tc = useThemeColors();
    if (loading) {
        return <View style={styles.sectionLoading}><ActivityIndicator size="small" color={tc.primary} /></View>;
    }
    return (
        <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <ProductCard product={item} variant="compact" />}
        />
    );
}

// ─── Grid Product List (desktop) ─────────────────────────────────
function ProductGridList({ data, loading, numColumns }: { data: MarketplaceProduct[]; loading: boolean; numColumns: number }) {
    const tc = useThemeColors();
    if (loading) {
        return <View style={styles.sectionLoading}><ActivityIndicator size="small" color={tc.primary} /></View>;
    }
    return (
        <FlatList
            data={data}
            scrollEnabled={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={numColumns}
            key={'top-' + numColumns}
            columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                    <ProductCard product={item} variant="compact" />
                </View>
            )}
        />
    );
}

// ─── Search Result Product Card ────────────────────────────────────
function ProductSearchResult({ product, tc }: { product: MarketplaceProduct; tc: any }) {
    const router = useRouter();
    return (
        <Pressable
            style={{
                flexDirection: 'row',
                padding: 12,
                marginHorizontal: 20,
                marginBottom: 8,
                borderRadius: 12,
                backgroundColor: tc.bgCard,
                borderColor: tc.borderLight,
                borderWidth: 1,
                gap: 12,
            }}
            onPress={() => router.push(`/product/${product.id}` as any)}
        >
            {product.image_url ? (
                <Image
                    source={{ uri: product.image_url }}
                    style={{ width: 64, height: 64, borderRadius: 10 }}
                />
            ) : (
                <View style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' }}>
                    <PackageSearch size={24} color="#fff" />
                </View>
            )}
            <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
                <Text style={{ fontWeight: '600', color: tc.text, fontSize: 14 }}>
                    {product.name}
                </Text>
                <Text style={{ color: tc.textMuted, fontSize: 12 }}>
                    {product.business_name || (product as any).business?.name}
                </Text>
                <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 14 }}>
                    ${product.price.toLocaleString('es-AR')}
                </Text>
            </View>
        </Pressable>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function DeliveryScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { isDesktop, isMobile, businessCols, productCols,
            maxContentWidth, horizontalPadding } = useResponsive();
    const { itemCount } = useCartStore();
    const { currentLocality } = useLocationStore();
    const scrollY = useRef(new Animated.Value(0)).current;

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        vendors,
        delivery,
        pickup,
        topProducts,
        allProducts,
        loadMoreProducts,
    } = useMarketplaceData(currentLocality?.id);

    // ── Category filter helper ───────────────────────────────────
    const filterByCategory = useCallback((businesses: Business[]): Business[] => {
        if (!selectedCategory || selectedCategory === 'all') return businesses;
        const query = selectedCategory.toLowerCase();
        return businesses.filter(b => {
            // Match by category field
            if (b.category && b.category.toLowerCase() === query) return true;
            // Match by tags array
            if (b.tags?.some(t => t.toLowerCase().includes(query))) return true;
            // Match by name containing category
            if (b.name.toLowerCase().includes(query)) return true;
            
            // Match by products (using both allProducts and topProducts)
            const businessProducts = [
                ...allProducts.data.filter(p => p.business_id === b.id),
                ...topProducts.data.filter(p => p.business_id === b.id)
            ];
            
            // Deduplicate local products
            const uniqueBizProducts = businessProducts.filter((p, index, self) => 
                self.findIndex(t => t.id === p.id) === index
            );

            if (uniqueBizProducts.some(p =>
                p.is_available && (
                    p.name.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query) ||
                    (p.category && p.category.toLowerCase().includes(query)) ||
                    p.tags?.some(t => t.toLowerCase().includes(query))
                )
            )) return true;

            return false;
        });
    }, [selectedCategory, allProducts.data, topProducts.data]);

    const filterProductByCategory = useCallback((products: MarketplaceProduct[]): MarketplaceProduct[] => {
        if (!selectedCategory || selectedCategory === 'all') return products;
        const query = selectedCategory.toLowerCase();
        return products.filter(p => {
            if (p.category && p.category.toLowerCase().includes(query)) return true;
            if (p.subcategory && p.subcategory.toLowerCase().includes(query)) return true;
            if (p.tags?.some(t => t.toLowerCase().includes(query))) return true;
            if (p.name.toLowerCase().includes(query)) return true;
            if (p.description?.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [selectedCategory]);

    // ── Filtered business & product sections (instant, no extra fetch) ─────
    const filteredVendors = useMemo(() => filterByCategory(vendors.data), [vendors.data, filterByCategory]);
    const filteredDelivery = useMemo(() => filterByCategory(delivery.data), [delivery.data, filterByCategory]);
    const filteredPickup = useMemo(() => filterByCategory(pickup.data), [pickup.data, filterByCategory]);
    const filteredTopProducts = useMemo(() => filterProductByCategory(topProducts.data), [topProducts.data, filterProductByCategory]);
    const filteredAllProducts = useMemo(() => filterProductByCategory(allProducts.data), [allProducts.data, filterProductByCategory]);

    // ── Search results logic (intelligent search) ────────────────
    const searchResults = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return null;

        // Combine all known businesses from useMarketplaceData and deduplicate
        const allBusinessesMap = new Map<string, Business>();
        vendors.data.forEach(b => allBusinessesMap.set(b.id, b));
        delivery.data.forEach(b => allBusinessesMap.set(b.id, b));
        pickup.data.forEach(b => allBusinessesMap.set(b.id, b));
        const allBusinesses = Array.from(allBusinessesMap.values());

        // Negocios que coinciden
        const matchedBusinesses = allBusinesses.filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.description?.toLowerCase().includes(query) ||
            b.tags?.some(t => t.toLowerCase().includes(query))
        );

        // Productos que coinciden (de cualquier negocio)
        const matchedProducts = allProducts.data.filter(p =>
            p.is_available && (
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                p.tags?.some(t => t.toLowerCase().includes(query))
            )
        );

        // Para cada producto, encontrar su negocio
        const productsWithBusiness = matchedProducts.map(p => ({
            ...p,
            business: allBusinesses.find(b => b.id === p.business_id),
        })).filter(p => p.business); // solo si el negocio existe

        // Deduplicate products by ID to prevent key errors
        const uniqueProductsWithBusiness: typeof productsWithBusiness = [];
        const seenProdIds = new Set<string>();
        productsWithBusiness.forEach(p => {
            if (!seenProdIds.has(p.id)) {
                seenProdIds.add(p.id);
                uniqueProductsWithBusiness.push(p);
            }
        });

        // Agregar negocios que tienen productos que coinciden
        // (aunque el nombre del negocio no coincida)
        const businessesFromProducts = uniqueProductsWithBusiness
            .map(p => p.business!)
            .filter(b => !matchedBusinesses.find(m => m.id === b.id));

        // Deduplicate businesses by ID to prevent key errors
        const combinedBusinesses = [...matchedBusinesses, ...businessesFromProducts];
        const uniqueBusinesses: Business[] = [];
        const seenBizIds = new Set<string>();
        combinedBusinesses.forEach(b => {
            if (!seenBizIds.has(b.id)) {
                seenBizIds.add(b.id);
                uniqueBusinesses.push(b);
            }
        });

        return {
            businesses: uniqueBusinesses,
            products: uniqueProductsWithBusiness,
            totalResults: uniqueBusinesses.length + uniqueProductsWithBusiness.length,
        };
    }, [searchQuery, vendors.data, delivery.data, pickup.data, allProducts.data]);

    // ── Computed Subtitle logic ──────────────────────────────────
    const headerSubtitle = React.useMemo(() => {
        if (vendors.loading) return "TU ZONA";
        const uniqueLocalities = new Set(vendors.data.map(b => b.locality_id));
        if (uniqueLocalities.size > 1) {
            return "COMARCA DEL COLORADO";
        }
        return currentLocality?.name?.toUpperCase() || "TU ZONA";
    }, [vendors.loading, vendors.data, currentLocality]);

    // ── Empty check ──────────────────────────────────────────────
    const isAnyLoading = vendors.loading || delivery.loading || pickup.loading || topProducts.loading || allProducts.loading;
    const allEmpty = !isAnyLoading &&
        filteredVendors.length === 0 &&
        filteredDelivery.length === 0 &&
        filteredPickup.length === 0 &&
        filteredTopProducts.length === 0 &&
        filteredAllProducts.length === 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={isDesktop ? [] : ['top']}>
            <AppHeader
                title="Sabor Local"
                subtitle={headerSubtitle}
                leftIcon="menu"
                rightButtons={['search', 'favorites', 'messages', 'notifications', 'cart']}
                onSearch={setSearchQuery}
                searchPlaceholder="Buscar restaurantes..."
                scrollY={scrollY}
            />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.mainList,
                    { maxWidth: maxContentWidth, alignSelf: 'center' as const, width: '100%' },
                ]}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: Platform.OS !== 'web' }
                )}
                scrollEventThrottle={16}
            >
                {searchQuery.length > 0 && searchResults ? (
                    // MODO BÚSQUEDA
                    <View style={{ paddingBottom: 24 }}>
                        {searchResults.totalResults === 0 ? (
                            <View style={styles.emptySearch}>
                                <Text style={[styles.emptySearchTitle, { color: tc.text }]}>
                                    Sin resultados para "{searchQuery}"
                                </Text>
                                <Text style={[styles.emptySearchSub, { color: tc.textMuted }]}>
                                    Intentá con otro nombre o categoría
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Sección de productos */}
                                {searchResults.products.length > 0 && (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={[styles.searchSectionTitle, { color: tc.textMuted }]}>
                                            Productos ({searchResults.products.length})
                                        </Text>
                                        {searchResults.products.map((product, index) => (
                                            <ProductSearchResult
                                                key={`${product.id}-${index}`}
                                                product={product}
                                                tc={tc}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* Sección de negocios */}
                                {searchResults.businesses.length > 0 && (
                                    <View>
                                        <Text style={[styles.searchSectionTitle, { color: tc.textMuted }]}>
                                            Locales ({searchResults.businesses.length})
                                        </Text>
                                        <FlatList
                                            data={searchResults.businesses}
                                            scrollEnabled={false}
                                            keyExtractor={(b, index) => `${b.id}-${index}`}
                                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                                            renderItem={({ item }) => <BusinessCardCompact business={item} />}
                                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                ) : (
                    // MODO NORMAL
                    <View>
                        {/* Subtitle */}
                        <Text style={[styles.subtitle, { color: tc.textMuted }]}>Delivery y comida</Text>

                        {/* SECTION 1 — Categorías */}
                        <CategoriesGrid
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />

                        {/* SECTION 2 — Vendedores de Acá */}
                        {vendors.loading ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={tc.primary} />
                            </View>
                        ) : filteredVendors.length > 0 ? (
                            <View>
                                <SectionHeader title="Vendedores de Acá" onSeeAll={() => {}} />
                                {isMobile ? (
                                    <BusinessHorizontalList data={filteredVendors} loading={false} />
                                ) : (
                                    <BusinessGridList data={filteredVendors} loading={false} numColumns={businessCols} />
                                )}
                            </View>
                        ) : null}

                        {/* SECTION 3 — Te lo enviamos a tu casa */}
                        {delivery.loading ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={tc.primary} />
                            </View>
                        ) : filteredDelivery.length > 0 ? (
                            <View>
                                <SectionHeader title="Te lo enviamos a tu casa" onSeeAll={() => {}} />
                                {isMobile ? (
                                    <BusinessHorizontalList data={filteredDelivery} loading={false} />
                                ) : (
                                    <BusinessGridList data={filteredDelivery} loading={false} numColumns={businessCols} />
                                )}
                            </View>
                        ) : null}

                        {/* SECTION 4 — Retirá en el local */}
                        {pickup.loading ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={tc.primary} />
                            </View>
                        ) : filteredPickup.length > 0 ? (
                            <View>
                                <SectionHeader title="Retirá en el local" onSeeAll={() => {}} />
                                {isMobile ? (
                                    <BusinessHorizontalList data={filteredPickup} loading={false} />
                                ) : (
                                    <BusinessGridList data={filteredPickup} loading={false} numColumns={businessCols} />
                                )}
                            </View>
                        ) : null}

                        {/* SECTION 5 — Los más pedidos */}
                        {topProducts.loading ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={tc.primary} />
                            </View>
                        ) : filteredTopProducts.length > 0 ? (
                            <View>
                                <SectionHeader title="Los más pedidos" onSeeAll={() => {}} />
                                {isMobile ? (
                                    <ProductHorizontalList data={filteredTopProducts} loading={false} />
                                ) : (
                                    <ProductGridList data={filteredTopProducts} loading={false} numColumns={productCols} />
                                )}
                            </View>
                        ) : null}

                        {/* SECTION 6 — ¿Qué querés comer hoy? */}
                        {allProducts.loading ? (
                            <View style={styles.sectionLoading}>
                                <ActivityIndicator size="small" color={tc.primary} />
                            </View>
                        ) : filteredAllProducts.length > 0 ? (
                            <View>
                                <SectionHeader title="¿Qué querés comer hoy?" />
                                <FlatList
                                    data={filteredAllProducts}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item, index) => `${item.id || index}-${index}`}
                                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                                    renderItem={({ item, index }) => (
                                        <ProductCardCinematic
                                            item={item}
                                            index={index}
                                            cardWidth={isDesktop ? 180 : 160}
                                            onPress={() => router.push(`/product/${item.id}` as any)}
                                        />
                                    )}
                                />
                            </View>
                        ) : null}

                        {/* Loading more */}
                        {allProducts.loadingMore && (
                            <View style={styles.footerLoading}>
                                <ActivityIndicator size="small" color={tc.primary} />
                                <Text style={[styles.footerText, { color: tc.textMuted }]}>Cargando más...</Text>
                            </View>
                        )}

                        {/* Empty state category */}
                        {selectedCategory !== 'all' && allEmpty && (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIcon}>
                                    <UtensilsCrossed size={64} color={tc.textMuted} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>
                                    Sin resultados
                                </Text>
                                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                    No hay locales con productos de esta categoría todavía
                                </Text>
                            </View>
                        )}

                        {/* Empty state general */}
                        {selectedCategory === 'all' && allEmpty && (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIcon}>
                                    <UtensilsCrossed size={64} color={tc.textMuted} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>
                                    No hay negocios disponibles
                                </Text>
                                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                    Pronto habrá más negocios en tu zona
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 16,
        paddingHorizontal: 20,
        marginTop: 4,
    },
    horizontalList: {
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    sectionLoading: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainList: {
        paddingBottom: 104,
    },
    footerLoading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    footerText: {
        fontSize: 13,
        fontFamily: 'Nunito Sans',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    searchResultsHeader: {
        fontSize: 13,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontFamily: 'Nunito Sans',
    },
    emptySearch: {
        paddingHorizontal: 20,
        paddingTop: 40,
        alignItems: 'center',
        gap: 8,
    },
    emptySearchTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySearchSub: {
        fontSize: 13,
        textAlign: 'center',
    },
    searchSectionTitle: {
        fontSize: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontWeight: '700',
    },
});
