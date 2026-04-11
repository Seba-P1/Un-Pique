import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    useWindowDimensions,
    Platform,
    Animated,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UtensilsCrossed } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { CategoriesGrid, BusinessCardWide, ProductCard, SectionHeader } from '../../../components/delivery';
import { useLocationStore } from '../../../stores/locationStore';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useCartStore } from '../../../stores/cartStore';
import { AppHeader } from '../../../components/ui/AppHeader';
import { useMarketplaceData, MarketplaceProduct } from '../../../hooks/useMarketplaceData';
import { Business } from '../../../stores/businessStore';

// ─── Horizontal Business List (sections 2-4) ────────────────────
function BusinessHorizontalList({ data, loading }: { data: Business[]; loading: boolean }) {
    const tc = useThemeColors();

    if (loading) {
        return (
            <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={tc.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <BusinessCardWide business={item} />}
        />
    );
}

// ─── Horizontal Product List (section 5) ─────────────────────────
function ProductHorizontalList({ data, loading }: { data: MarketplaceProduct[]; loading: boolean }) {
    const tc = useThemeColors();

    if (loading) {
        return (
            <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={tc.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <ProductCard product={item} variant="compact" />}
        />
    );
}


// ─── Main Screen ─────────────────────────────────────────────────
export default function DeliveryScreen() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const { itemCount } = useCartStore();
    const { currentLocality } = useLocationStore();
    const scrollY = useRef(new Animated.Value(0)).current;

    const isDesktop = width >= 768;

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

    // ── Section 6 render item ────────────────────────────────────
    const renderGridProduct = useCallback(({ item }: { item: MarketplaceProduct }) => (
        <ProductCard product={item} variant="grid" />
    ), []);

    const keyExtractor = useCallback((item: MarketplaceProduct) => item.id, []);

    // ── Header with sections 1-5 ─────────────────────────────────
    const ListHeader = useCallback(() => (
        <View style={[isDesktop && styles.desktopContainer]}>
            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: tc.textMuted }]}>Delivery y comida</Text>

            {/* SECTION 1 — Categorías */}
            <CategoriesGrid
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            {/* SECTION 2 — Vendedores de Acá */}
            {(vendors.loading || vendors.data.length > 0) && (
                <View>
                    <SectionHeader
                        title="Vendedores de Acá"
                        onSeeAll={() => {
                            // TODO: navegar a lista filtrada
                        }}
                    />
                    <BusinessHorizontalList data={vendors.data} loading={vendors.loading} />
                </View>
            )}

            {/* SECTION 3 — Te lo enviamos a tu casa */}
            {(delivery.loading || delivery.data.length > 0) && (
                <View>
                    <SectionHeader
                        title="Te lo enviamos a tu casa"
                        onSeeAll={() => {
                            // TODO: navegar a lista filtrada
                        }}
                    />
                    <BusinessHorizontalList data={delivery.data} loading={delivery.loading} />
                </View>
            )}

            {/* SECTION 4 — Retirá en el local */}
            {(pickup.loading || pickup.data.length > 0) && (
                <View>
                    <SectionHeader
                        title="Retirá en el local"
                        onSeeAll={() => {
                            // TODO: navegar a lista filtrada
                        }}
                    />
                    <BusinessHorizontalList data={pickup.data} loading={pickup.loading} />
                </View>
            )}

            {/* SECTION 5 — Los más pedidos */}
            {(topProducts.loading || topProducts.data.length > 0) && (
                <View>
                    <SectionHeader
                        title="Los más pedidos"
                        onSeeAll={() => {
                            // TODO: navegar a lista filtrada
                        }}
                    />
                    <ProductHorizontalList data={topProducts.data} loading={topProducts.loading} />
                </View>
            )}

            {/* SECTION 6 Header */}
            {(allProducts.loading || allProducts.data.length > 0) && (
                <SectionHeader title="¿Qué querés comer hoy?" />
            )}

            {/* Loading for section 6 initial load */}
            {allProducts.loading && (
                <View style={styles.sectionLoading}>
                    <ActivityIndicator size="small" color={tc.primary} />
                </View>
            )}
        </View>
    ), [
        tc, isDesktop, selectedCategory, vendors, delivery, pickup, topProducts, allProducts.loading, allProducts.data.length,
    ]);

    // ── Footer (loading more indicator) ──────────────────────────
    const ListFooter = useCallback(() => {
        if (!allProducts.loadingMore) return null;
        return (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={tc.primary} />
                <Text style={[styles.footerText, { color: tc.textMuted }]}>Cargando más...</Text>
            </View>
        );
    }, [allProducts.loadingMore, tc]);

    // ── Empty state ──────────────────────────────────────────────
    const EmptyComponent = useCallback(() => {
        if (allProducts.loading) return null;
        // Only show if everything is empty and not loading
        const allEmpty = vendors.data.length === 0 && delivery.data.length === 0 &&
            pickup.data.length === 0 && topProducts.data.length === 0 && allProducts.data.length === 0;
        const allDoneLoading = !vendors.loading && !delivery.loading && !pickup.loading && !topProducts.loading;

        if (!allEmpty || !allDoneLoading) return null;

        return (
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
        );
    }, [allProducts, vendors, delivery, pickup, topProducts, tc]);

    // ── Computed Subtitle logic ──────────────────────────────────
    const headerSubtitle = React.useMemo(() => {
        if (vendors.loading) return "TU ZONA";
        const uniqueLocalities = new Set(vendors.data.map(b => b.locality_id));
        if (uniqueLocalities.size > 1) {
            return "COMARCA DEL COLORADO";
        }
        return currentLocality?.name?.toUpperCase() || "TU ZONA";
    }, [vendors.loading, vendors.data, currentLocality]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={isDesktop ? [] : ['top']}>
            <AppHeader
                title="Sabor Local"
                subtitle={headerSubtitle}
                leftIcon="menu"
                rightButtons={['search', 'favorites', 'notifications', 'cart']}
                onSearch={setSearchQuery}
                searchPlaceholder="Buscar restaurantes..."
                scrollY={scrollY}
            />

            <Animated.FlatList
                data={allProducts.loading ? [] : allProducts.data}
                renderItem={renderGridProduct}
                keyExtractor={keyExtractor}
                numColumns={2}
                key="product-grid-2col"
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={EmptyComponent}
                contentContainerStyle={[
                    styles.mainList,
                    isDesktop && { maxWidth: 900, alignSelf: 'center', width: '100%' },
                ]}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.2}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: Platform.OS !== 'web' }
                )}
                scrollEventThrottle={16}
            />
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    desktopContainer: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
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
        paddingBottom: 40,
    },
    gridRow: {
        paddingHorizontal: 14,
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
});
