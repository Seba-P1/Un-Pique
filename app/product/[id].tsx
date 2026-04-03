// Product Detail — Estilo PedidosYa premium
// Carrusel de fotos, info, contador, envío, productos relacionados, botón flotante
import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Dimensions, Platform, useWindowDimensions, Animated, Share
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft, Heart, Share2, Minus, Plus, Clock, MapPin,
    Star, ShoppingCart, ChevronRight, Truck, Store
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCartStore } from '../../stores/cartStore';
import { showAlert } from '../../utils/alert';

const HEADER_IMAGE_HEIGHT = 320;

// Mock product data
const MOCK_PRODUCTS: Record<string, any> = {
    '1': {
        id: '1', name: 'Hamburguesa Clásica', description: 'Medallón de carne 200g, lechuga, tomate, cebolla morada, pepinillos, mostaza y ketchup artesanal. Servida en pan brioche tostado.',
        price: 3500, originalPrice: 4200, rating: 4.7, reviews: 128, calories: '650 kcal', prepTime: '15-20 min',
        images: [
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
            'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
        ],
        businessId: 'b1', businessName: 'La Parrilla Gourmet', businessSlug: 'la-parrilla-gourmet', businessLogo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&q=60',
        deliveryFee: 350, deliveryTime: '25-35 min', minOrder: 2000,
        category: 'Hamburguesas', is_available: true,
    },
    '2': {
        id: '2', name: 'Pizza Muzzarella', description: 'Base de masa madre, salsa de tomate San Marzano, muzzarella premium fundida, orégano fresco y aceite de oliva extra virgen.',
        price: 4800, originalPrice: null, rating: 4.9, reviews: 256, calories: '280 kcal/porción', prepTime: '20-25 min',
        images: [
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
            'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
        ],
        businessId: 'b2', businessName: 'Pizzería La Mamma', businessSlug: 'pizzeria-la-mamma', businessLogo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&q=60',
        deliveryFee: 300, deliveryTime: '30-40 min', minOrder: 1500,
        category: 'Pizzas', is_available: true,
    },
};

const RELATED_PRODUCTS = [
    { id: 'r1', name: 'Papas Fritas Cheddar', price: 1800, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=60' },
    { id: 'r2', name: 'Nuggets x10', price: 2200, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=60' },
    { id: 'r3', name: 'Coca-Cola 500ml', price: 900, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=60' },
    { id: 'r4', name: 'Helado Artesanal', price: 1500, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=60' },
];

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const addItem = useCartStore((s) => s.addItem);
    const cartItemCount = useCartStore((s) => s.itemCount);

    const product = MOCK_PRODUCTS[id || '1'] || MOCK_PRODUCTS['1'];
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const total = product.price * quantity;

    const handleAddToCart = useCallback(() => {
        addItem({
            productId: product.id,
            productName: product.name,
            productImage: product.images[0],
            businessId: product.businessId,
            businessName: product.businessName,
            quantity,
            unitPrice: product.price,
        });
        showAlert('¡Agregado!', `${quantity}x ${product.name} agregado al carrito`);
    }, [product, quantity, addItem]);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({ message: `¡Mirá ${product.name} en Un Pique! $${product.price.toLocaleString()}` });
        } catch { }
    }, [product]);

    const imageWidth = isDesktop ? Math.min(width * 0.5, 600) : width;

    return (
        <SafeAreaView style={[styles.rootContainer, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
            <ScrollView
                style={{ flex: 1, backgroundColor: tc.bg }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Desktop: Side-by-side layout */}
                <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
                    {/* IMAGE CAROUSEL */}
                    <View style={[styles.imageSection, isDesktop && { width: '50%', maxWidth: 600 }]}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
                                setActiveImageIndex(index);
                            }}
                        >
                            {product.images.map((img: string, i: number) => (
                                <Image key={i} source={{ uri: img }} style={[styles.carouselImage, { width: imageWidth, height: isDesktop ? 450 : HEADER_IMAGE_HEIGHT }]} />
                            ))}
                        </ScrollView>

                        {/* Nav bar overlay */}
                        <View style={[styles.navOverlay, { paddingTop: isDesktop ? 12 : Math.max(insets.top, 12) }]}>
                            <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => router.back()}>
                                <ArrowLeft size={20} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.navRight}>
                                <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => setIsFavorite(!isFavorite)}>
                                    <Heart size={20} color="#fff" fill={isFavorite ? '#FF4757' : 'transparent'} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={handleShare}>
                                    <Share2 size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Dots */}
                        {product.images.length > 1 && (
                            <View style={styles.dotsRow}>
                                {product.images.map((_: string, i: number) => (
                                    <View key={i} style={[styles.dot, activeImageIndex === i && styles.dotActive]} />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* INFO SECTION */}
                    <View style={[styles.infoSection, isDesktop && { flex: 1, paddingLeft: 32 }]}>
                        {/* Business Badge */}
                        <TouchableOpacity style={[styles.businessBadge, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                            onPress={() => router.push(`/shop/${product.businessSlug || product.businessId}` as any)}>
                            <Image source={{ uri: product.businessLogo }} style={styles.businessLogo} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.businessName, { color: tc.text }]}>{product.businessName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} color={tc.textMuted} />
                                    <Text style={[styles.businessMeta, { color: tc.textMuted }]}>{product.deliveryTime}</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color={tc.textMuted} />
                        </TouchableOpacity>

                        {/* Product Name + Rating */}
                        <Text style={[styles.productName, { color: tc.text }]}>{product.name}</Text>
                        <View style={styles.ratingRow}>
                            <Star size={16} color="#FFB800" fill="#FFB800" />
                            <Text style={[styles.ratingText, { color: tc.text }]}>{product.rating}</Text>
                            <Text style={[styles.reviewsText, { color: tc.textMuted }]}>({product.reviews} opiniones)</Text>
                            <View style={[styles.categoryBadge, { backgroundColor: tc.isDark ? 'rgba(255,107,53,0.15)' : 'rgba(255,107,53,0.1)' }]}>
                                <Text style={styles.categoryText}>{product.category}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={[styles.description, { color: tc.textSecondary }]}>{product.description}</Text>

                        {/* Meta: Calories, Prep Time */}
                        <View style={[styles.metaRow, { borderColor: tc.borderLight }]}>
                            <View style={styles.metaItem}>
                                <Clock size={16} color={colors.primary.DEFAULT} />
                                <Text style={[styles.metaValue, { color: tc.text }]}>{product.prepTime}</Text>
                                <Text style={[styles.metaLabel, { color: tc.textMuted }]}>Preparación</Text>
                            </View>
                            <View style={[styles.metaDivider, { backgroundColor: tc.borderLight }]} />
                            <View style={styles.metaItem}>
                                <Truck size={16} color={colors.primary.DEFAULT} />
                                <Text style={[styles.metaValue, { color: tc.text }]}>${product.deliveryFee}</Text>
                                <Text style={[styles.metaLabel, { color: tc.textMuted }]}>Envío</Text>
                            </View>
                            <View style={[styles.metaDivider, { backgroundColor: tc.borderLight }]} />
                            <View style={styles.metaItem}>
                                <Store size={16} color={colors.primary.DEFAULT} />
                                <Text style={[styles.metaValue, { color: tc.text }]}>${product.minOrder}</Text>
                                <Text style={[styles.metaLabel, { color: tc.textMuted }]}>Mín. pedido</Text>
                            </View>
                        </View>

                        {/* Price + Quantity */}
                        <View style={[styles.priceSection, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                                    <Text style={[styles.price, { color: tc.text }]}>${product.price.toLocaleString()}</Text>
                                    {product.originalPrice && (
                                        <Text style={[styles.originalPrice, { color: tc.textMuted }]}>${product.originalPrice.toLocaleString()}</Text>
                                    )}
                                </View>
                                {product.originalPrice && (
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>-{Math.round((1 - product.price / product.originalPrice) * 100)}%</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.quantityControl, { borderColor: tc.borderLight }]}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                                    <Minus size={16} color={quantity <= 1 ? tc.textMuted : colors.primary.DEFAULT} />
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: tc.text }]}>{quantity}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
                                    <Plus size={16} color={colors.primary.DEFAULT} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* RELATED PRODUCTS */}
                <View style={[styles.relatedSection, isDesktop && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
                    <Text style={[styles.relatedTitle, { color: tc.text }]}>Más de {product.businessName}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
                        {RELATED_PRODUCTS.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.relatedCard, { backgroundColor: tc.bgCard }]}
                                onPress={() => showAlert(item.name, `$${item.price.toLocaleString()}`)}
                                activeOpacity={0.8}>
                                <Image source={{ uri: item.image }} style={styles.relatedImage} />
                                <Text style={[styles.relatedName, { color: tc.text }]} numberOfLines={2}>{item.name}</Text>
                                <Text style={[styles.relatedPrice, { color: colors.primary.DEFAULT }]}>${item.price.toLocaleString()}</Text>
                                <TouchableOpacity style={[styles.relatedAddBtn, { backgroundColor: colors.primary.DEFAULT }]}>
                                    <Plus size={14} color="#fff" strokeWidth={3} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* FLOATING BOTTOM BAR */}
            <View style={[styles.bottomBar, {
                backgroundColor: tc.bgCard,
                paddingBottom: insets.bottom + 12,
                ...(Platform.OS === 'web' ? { boxShadow: '0px -4px 20px rgba(0,0,0,0.1)' } : {
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                }),
            }]}>
                <View style={styles.bottomLeft}>
                    <Text style={[styles.bottomLabel, { color: tc.textMuted }]}>Total</Text>
                    <Text style={[styles.bottomTotal, { color: tc.text }]}>${total.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.85}>
                    <ShoppingCart size={18} color="#fff" />
                    <Text style={styles.addToCartText}>Agregar al carrito</Text>
                    {cartItemCount > 0 && (
                        <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItemCount}</Text></View>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1 },
    mainLayout: {},
    desktopLayout: { flexDirection: 'row', maxWidth: 1200, alignSelf: 'center', width: '100%', paddingTop: 20 },
    // Image
    imageSection: { position: 'relative' },
    carouselImage: { resizeMode: 'cover' },
    navOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12 },
    navBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navRight: { flexDirection: 'row', gap: 8 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 16, left: 0, right: 0 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#fff', width: 24 },
    // Info
    infoSection: { padding: 20 },
    businessBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
    businessLogo: { width: 44, height: 44, borderRadius: 12 },
    businessName: { fontSize: 15, fontWeight: '700' },
    businessMeta: { fontSize: 12 },
    productName: { fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    ratingText: { fontSize: 15, fontWeight: '700' },
    reviewsText: { fontSize: 13 },
    categoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginLeft: 4 },
    categoryText: { color: colors.primary.DEFAULT, fontSize: 12, fontWeight: '700' },
    description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
    // Meta
    metaRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, marginBottom: 20 },
    metaItem: { flex: 1, alignItems: 'center', gap: 4 },
    metaValue: { fontSize: 15, fontWeight: '700' },
    metaLabel: { fontSize: 11 },
    metaDivider: { width: 1, height: '100%' },
    // Price
    priceSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
    price: { fontSize: 24, fontWeight: '900' },
    originalPrice: { fontSize: 16, textDecorationLine: 'line-through' },
    discountBadge: { backgroundColor: '#22C55E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
    discountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
    qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 16, fontWeight: '800', minWidth: 30, textAlign: 'center' },
    // Related
    relatedSection: { paddingHorizontal: 20, marginTop: 20 },
    relatedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
    relatedScroll: { gap: 12, paddingBottom: 10 },
    relatedCard: { width: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    relatedImage: { width: '100%', height: 110, resizeMode: 'cover' },
    relatedName: { fontSize: 13, fontWeight: '600', padding: 10, paddingBottom: 2 },
    relatedPrice: { fontSize: 14, fontWeight: '800', paddingHorizontal: 10, paddingBottom: 10 },
    relatedAddBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    // Bottom bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, gap: 16 },
    bottomLeft: {},
    bottomLabel: { fontSize: 12, fontWeight: '600' },
    bottomTotal: { fontSize: 22, fontWeight: '900' },
    addToCartBtn: { flex: 1, backgroundColor: colors.primary.DEFAULT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, position: 'relative' },
    addToCartText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    cartBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF4757', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
