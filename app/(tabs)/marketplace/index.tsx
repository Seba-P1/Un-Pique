import React, { useState, useRef, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { CategoriesGrid, BusinessCardWide, ProductCard, SectionHeader } from '../../../components/delivery';
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
        <>
            <View style={cinematicStyles.overlay} />
            <View style={cinematicStyles.content}>
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
        </>
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
    overlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '65%' as any,
        backgroundColor: 'rgba(0,0,0,0.62)',
    },
    content: {
        position: 'absolute',
        bottom: 12, left: 10, right: 10,
    },
    title: {
        fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    business: {
        fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    price: {
        fontSize: 13, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <BusinessCardWide business={item} />}
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
            keyExtractor={(item) => item.id}
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
            keyExtractor={(item) => item.id}
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
            keyExtractor={(item) => item.id}
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
    const allEmpty = !vendors.loading && !delivery.loading && !pickup.loading &&
        !topProducts.loading && !allProducts.loading &&
        vendors.data.length === 0 && delivery.data.length === 0 &&
        pickup.data.length === 0 && topProducts.data.length === 0 &&
        allProducts.data.length === 0;

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
                        <SectionHeader title="Vendedores de Acá" onSeeAll={() => {}} />
                        {isMobile ? (
                            <BusinessHorizontalList data={vendors.data} loading={vendors.loading} />
                        ) : (
                            <BusinessGridList data={vendors.data} loading={vendors.loading} numColumns={businessCols} />
                        )}
                    </View>
                )}

                {/* SECTION 3 — Te lo enviamos a tu casa */}
                {(delivery.loading || delivery.data.length > 0) && (
                    <View>
                        <SectionHeader title="Te lo enviamos a tu casa" onSeeAll={() => {}} />
                        {isMobile ? (
                            <BusinessHorizontalList data={delivery.data} loading={delivery.loading} />
                        ) : (
                            <BusinessGridList data={delivery.data} loading={delivery.loading} numColumns={businessCols} />
                        )}
                    </View>
                )}

                {/* SECTION 4 — Retirá en el local */}
                {(pickup.loading || pickup.data.length > 0) && (
                    <View>
                        <SectionHeader title="Retirá en el local" onSeeAll={() => {}} />
                        {isMobile ? (
                            <BusinessHorizontalList data={pickup.data} loading={pickup.loading} />
                        ) : (
                            <BusinessGridList data={pickup.data} loading={pickup.loading} numColumns={businessCols} />
                        )}
                    </View>
                )}

                {/* SECTION 5 — Los más pedidos */}
                {(topProducts.loading || topProducts.data.length > 0) && (
                    <View>
                        <SectionHeader title="Los más pedidos" onSeeAll={() => {}} />
                        {isMobile ? (
                            <ProductHorizontalList data={topProducts.data} loading={topProducts.loading} />
                        ) : (
                            <ProductGridList data={topProducts.data} loading={topProducts.loading} numColumns={productCols} />
                        )}
                    </View>
                )}

                {/* SECTION 6 — ¿Qué querés comer hoy? */}
                {(allProducts.loading || allProducts.data.length > 0) && (
                    <View>
                        <SectionHeader title="¿Qué querés comer hoy?" />
                        {allProducts.loading ? (
                            <View style={styles.sectionLoading}>
                                <ActivityIndicator size="small" color={tc.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={allProducts.data}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id?.toString()}
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
                        )}
                    </View>
                )}

                {/* Loading more */}
                {allProducts.loadingMore && (
                    <View style={styles.footerLoading}>
                        <ActivityIndicator size="small" color={tc.primary} />
                        <Text style={[styles.footerText, { color: tc.textMuted }]}>Cargando más...</Text>
                    </View>
                )}

                {/* Empty state */}
                {allEmpty && (
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
        paddingBottom: 40,
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
