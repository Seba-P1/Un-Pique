import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Image, TouchableOpacity, StatusBar, Platform, useWindowDimensions, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Star, MapPin, Search, Share2, Heart, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { Button } from '../../components/ui';
import { ProductItem, ProductModal } from '../../components/shop';
import { useCartStore } from '../../stores/cartStore';
import { useBusinessStore } from '../../stores/businessStore';
import { useProductStore } from '../../stores/productStore';
import { Skeleton } from '../../components/ui/Skeleton';
import { useBusinessDetail } from '../../hooks/useBusinesses';
import BusinessMap from '../../components/shop/BusinessMap';
import { useThemeColors } from '../../hooks/useThemeColors';

const HEADER_HEIGHT = 280;

const MOCK_BUSINESSES: Record<string, any> = {
    '1': { id: '1', name: 'Café Central', slug: 'cafe-central', description: 'El mejor café de la ciudad con ambiente acogedor y granos seleccionados de origen local.', logo_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=60', cover_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80', category: 'Café', rating: 4.7, reviews_count: 124, delivery_time: '20-30 min', is_open: true, address: 'Plaza 25 de Mayo' },
    '2': { id: '2', name: 'Heladería Fri', slug: 'heladeria-fri', description: 'Helado artesanal con sabores únicos hechos con ingredientes naturales.', logo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=60', cover_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900&q=80', category: 'Heladería', rating: 4.9, reviews_count: 89, delivery_time: '15-25 min', is_open: true, address: 'Av. Libertador 220' },
    default: { id: '0', name: 'Comercio Demo', slug: 'demo', description: 'Este es un comercio de demostración para explorar la plataforma.', logo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=60', cover_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80', category: 'General', rating: 4.5, reviews_count: 45, delivery_time: '25-40 min', is_open: true, address: 'Centro' },
};

const MOCK_PRODUCTS = [
    { id: 'p1', name: 'Producto de ejemplo 1', description: 'Descripción del producto de ejemplo uno', price: 2500, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=60', is_available: true },
    { id: 'p2', name: 'Producto de ejemplo 2', description: 'Descripción del producto de ejemplo dos', price: 3200, image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&q=60', is_available: true },
    { id: 'p3', name: 'Producto de ejemplo 3', description: 'Descripción del producto de ejemplo tres', price: 1800, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=60', is_available: true },
];

export default function BusinessDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { data: remoteBusiness, isLoading: loading } = useBusinessDetail(id as string);
    const { products: remoteProducts, fetchProducts } = useProductStore();
    const [activeTab, setActiveTab] = useState('menu');
    const scrollY = useRef(new Animated.Value(0)).current;
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { items } = useCartStore();

    const business = remoteBusiness || MOCK_BUSINESSES[id as string] || MOCK_BUSINESSES['default'];
    const products = remoteProducts.length > 0 ? remoteProducts : MOCK_PRODUCTS;
    const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

    useEffect(() => {
        if (remoteBusiness?.id) fetchProducts(remoteBusiness.id);
    }, [remoteBusiness]);

    const handleProductPress = (product: any) => {
        setSelectedProduct(product);
        setModalVisible(true);
    };

    const handleSearch = () => Alert.alert('Buscar', 'Función de búsqueda de productos próximamente.');
    const handleFavorite = () => Alert.alert('Favoritos', 'Añadido a tus favoritos (Próximamente).');
    const handleShare = async () => {
        try {
            await Share.share({ message: `¡Mira este lugar en Un Pique!\n${business.name} - ${business.description}` });
        } catch (error) {
            console.log(error);
        }
    };

    if (loading && !business) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg }]}>
                <Skeleton height={HEADER_HEIGHT} borderRadius={0} />
                <View style={{ padding: 20 }}>
                    <Skeleton width={200} height={24} style={{ marginBottom: 10 }} />
                    <Skeleton width={120} height={16} />
                </View>
            </View>
        );
    }

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_HEIGHT - 80],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const contentMaxWidth = isDesktop ? 900 : undefined;
    const heroHeight = isDesktop ? 340 : HEADER_HEIGHT;

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <StatusBar barStyle="light-content" />

            {/* Sticky Top Nav */}
            <Animated.View style={[styles.stickyNav, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight, opacity: headerOpacity }]} />
            <SafeAreaView style={styles.navBar} edges={['top']}>
                <TouchableOpacity style={[styles.circleButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => router.back()}>
                    <ArrowLeft size={20} color="#fff" />
                </TouchableOpacity>
                <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity, color: tc.text }]} numberOfLines={1}>
                    {business.name}
                </Animated.Text>
                <View style={styles.rightButtons}>
                    <TouchableOpacity style={[styles.circleButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={handleSearch}>
                        <Search size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.circleButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={handleShare}>
                        <Share2 size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

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
                <View style={isDesktop ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', marginTop: -60 } : { marginTop: -50 }}>

                    {/* Info Card */}
                    <View style={[styles.infoCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }, isDesktop && { borderRadius: 24, borderWidth: 1, marginHorizontal: 20 }]}>
                        <View style={styles.infoCardInner}>
                            {/* Logo */}
                            <View style={[styles.logoWrap, { borderColor: tc.bgCard, backgroundColor: tc.bgCard }]}>
                                <Image source={{ uri: business.logo_url }} style={styles.logo} />
                            </View>

                            <View style={{ flex: 1, paddingLeft: isDesktop ? 110 : 0, paddingTop: isDesktop ? 0 : 50 }}>
                                <View style={styles.titleRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.name, { color: tc.text }]}>{business.name}</Text>
                                        <Text style={[styles.category, { color: tc.textSecondary }]}>{business.category}</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.heartBtn, { backgroundColor: tc.bgHover }]} onPress={handleFavorite}>
                                        <Heart size={20} color={tc.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                {business.description ? (
                                    <Text style={[styles.description, { color: tc.textSecondary }]}>{business.description}</Text>
                                ) : null}

                                <View style={styles.statsRow}>
                                    <View style={[styles.stat, { backgroundColor: tc.bgHover }]}>
                                        <Star size={14} color={colors.warning} fill={colors.warning} />
                                        <Text style={[styles.statText, { color: tc.text }]}>{business.rating}</Text>
                                        <Text style={[styles.statCount, { color: tc.textMuted }]}>({business.reviews_count || 0})</Text>
                                    </View>
                                    <View style={[styles.stat, { backgroundColor: tc.bgHover }]}>
                                        <Clock size={14} color={tc.textSecondary} />
                                        <Text style={[styles.statText, { color: tc.text }]}>{business.delivery_time}</Text>
                                    </View>
                                    <View style={[styles.stat, { backgroundColor: tc.bgHover }]}>
                                        <MapPin size={14} color={colors.primary.DEFAULT} />
                                        <Text style={[styles.statText, { color: tc.text }]}>1.2 km</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabsContainer, { borderBottomColor: tc.borderLight }, isDesktop && { marginHorizontal: 20 }]}>
                        {['menu', 'reviews', 'info'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary.DEFAULT : tc.textMuted }]}>
                                    {tab === 'menu' ? 'Menú' : tab === 'reviews' ? 'Reseñas' : 'Info'}
                                </Text>
                                {activeTab === tab && <View style={styles.activeIndicator} />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    <View style={[styles.content, isDesktop && { marginHorizontal: 20, borderRadius: 16 }]}>
                        {activeTab === 'menu' && (
                            <View>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Destacados</Text>
                                {products.length === 0 ? (
                                    <View style={{ padding: 24, alignItems: 'center' }}>
                                        <Text style={{ fontFamily: 'Nunito Sans', color: tc.textMuted, fontSize: 15 }}>
                                            Este negocio aún no tiene productos cargados.
                                        </Text>
                                    </View>
                                ) : (
                                    products.map((product) => (
                                        <ProductItem
                                            key={product.id}
                                            product={product}
                                            onPress={() => handleProductPress(product)}
                                        />
                                    ))
                                )}
                            </View>
                        )}
                        {activeTab === 'reviews' && (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: tc.textSecondary, fontFamily: 'Nunito Sans' }}>Reseñas del lugar</Text>
                            </View>
                        )}
                        {activeTab === 'info' && (
                            <View style={{ paddingBottom: 24 }}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Ubicación</Text>
                                <View style={[styles.mapContainer, { borderColor: tc.borderLight }]}>
                                    <BusinessMap latitude={business.latitude} longitude={business.longitude} name={business.name} address={business.address} />
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={22} color={colors.primary.DEFAULT} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.addressLabel, { color: tc.text }]}>Dirección</Text>
                                        <Text style={[styles.addressValue, { color: tc.textSecondary }]}>{business.address || 'No disponible'}</Text>
                                    </View>
                                </View>
                                <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Horarios</Text>
                                <View style={styles.addressRow}>
                                    <Clock size={22} color={tc.textSecondary} />
                                    <View>
                                        <Text style={[styles.scheduleText, { color: tc.text }]}>Lunes a Viernes: 09:00 - 23:00</Text>
                                        <Text style={[styles.scheduleText, { color: tc.text }]}>Sábados y Domingos: 11:00 - 01:00</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* Product Modal */}
            <ProductModal visible={modalVisible} onClose={() => setModalVisible(false)} product={selectedProduct} businessId={(id as string) || '1'} businessName={business.name} />

            {/* Floating Cart Button (PedidosYa Style) */}
            <View style={[styles.floatingCartWrapper, isDesktop && { alignItems: 'center', right: 0 }, { pointerEvents: 'box-none' }]} >
                <TouchableOpacity
                    style={[styles.floatingCartPill, { backgroundColor: colors.primary.DEFAULT }]}
                    activeOpacity={0.85}
                    onPress={() => router.push('/cart' as any)}
                >
                    <View style={styles.iconSpacer}>
                        <ShoppingCart size={18} color="#fff" />
                    </View>
                    <Text style={styles.floatingPillText}>Ver Mi Pedido</Text>
                    {cartCount > 0 ? (
                        <View style={styles.floatingBadge}>
                            <Text style={styles.floatingBadgeText}>{cartCount}</Text>
                        </View>
                    ) : (
                        <View style={styles.iconSpacer} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    stickyNav: { position: 'absolute', top: 0, left: 0, right: 0, height: Platform.OS === 'android' ? 90 : 100, zIndex: 101, borderBottomWidth: 1 },
    navBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 102, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: Platform.OS === 'android' ? 90 : 100, paddingTop: Platform.OS === 'android' ? 40 : 10 },
    circleButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    rightButtons: { flexDirection: 'row', gap: 10 },
    headerTitle: { fontFamily: 'Nunito Sans', fontSize: 17, fontWeight: '700', maxWidth: 200, textAlign: 'center' },
    heroBanner: { width: '100%', overflow: 'hidden' },
    infoCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
    infoCardInner: { flexDirection: 'row', flexWrap: 'wrap' },
    logoWrap: { position: 'absolute', top: -40, left: 20, width: 80, height: 80, borderRadius: 40, borderWidth: 4, overflow: 'hidden', zIndex: 5 },
    logo: { width: '100%', height: '100%' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    name: { fontFamily: 'Nunito Sans', fontSize: 24, fontWeight: '800', lineHeight: 30 },
    category: { fontFamily: 'Nunito Sans', fontSize: 14, marginTop: 2 },
    description: { fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 20, marginTop: 8 },
    heartBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8, flexWrap: 'wrap' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statText: { fontFamily: 'Nunito Sans', fontSize: 13, fontWeight: '600' },
    statCount: { fontFamily: 'Nunito Sans', fontSize: 12 },
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
    floatingCartWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 32 : 24, left: 16, right: 16, alignItems: 'center', zIndex: 100 },
    floatingCartPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50, borderRadius: 25, width: '100%', maxWidth: 400, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */ },
    floatingPillText: { fontFamily: 'Nunito Sans', fontSize: 16, fontWeight: '700', color: '#fff' },
    floatingBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    floatingBadgeText: { fontFamily: 'Nunito Sans', fontSize: 13, fontWeight: '800', color: '#fff' },
    iconSpacer: { width: 26, alignItems: 'center', justifyContent: 'center' },
});
