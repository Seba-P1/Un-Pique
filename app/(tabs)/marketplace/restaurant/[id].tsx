import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, Animated, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import colors from '../../../../constants/colors';
import { ArrowLeft, Star, Clock, Truck, Share2, Heart, Plus, Minus, ArrowRight, Search, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '../../../../stores/productStore';
import { useBusinessStore } from '../../../../stores/businessStore';

export default function RestaurantDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const scrollY = useRef(new Animated.Value(0)).current;

    const isLargeScreen = width >= 1280; // xl in tailwind

    // Stores
    const { fetchBusinessBySlug, selectedBusiness, loading: businessLoading } = useBusinessStore();
    const { fetchProducts, products, loading: productsLoading } = useProductStore();

    useEffect(() => {
        if (id) {
            // First fetch business to get its DB ID (since id parameter could be a slug)
            fetchBusinessBySlug(id as string);
        }
    }, [id]);

    useEffect(() => {
        if (selectedBusiness) {
            fetchProducts(selectedBusiness.id);
        }
    }, [selectedBusiness]);

    // Derived Categories from real products
    const categories = Array.from(new Set(products.map(p => p.category_id || 'Otros'))).sort();
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]);
        }
    }, [categories]);

    // Filter items
    const filteredItems = products.filter(item => (item.category_id || 'Otros') === selectedCategory);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Animated.Image
                source={{ uri: selectedBusiness?.cover_url || 'https://images.unsplash.com/photo-1544025162-d76690b6860b?q=80&w=2000&auto=format&fit=crop' }}
                style={[styles.heroImage, {
                    transform: [{
                        scale: scrollY.interpolate({
                            inputRange: [-200, 0, 200],
                            outputRange: [1.2, 1, 1],
                            extrapolate: 'clamp'
                        })
                    }]
                }]}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                style={styles.heroOverlay}
            />

            {/* Navbar Overlay */}
            <SafeAreaView style={styles.navBar} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                <View style={styles.navActions}>
                    <TouchableOpacity style={styles.navActionButton}>
                        <Search color="white" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navActionButton}>
                        <Share2 color="white" size={20} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.restaurantInfo}>
                <View style={[styles.logoContainer, { backgroundColor: tc.bgCard }]}>
                    <Image
                        source={{ uri: selectedBusiness?.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200&auto=format&fit=crop' }}
                        style={styles.logo}
                    />
                </View>
                <View style={styles.infoContent}>
                    <Text style={styles.restaurantName}>{selectedBusiness?.name || 'Cargando...'}</Text>
                    <View style={styles.badgesRow}>
                        <View style={styles.badge}>
                            <Star size={14} color={colors.primary.DEFAULT} fill={colors.primary.DEFAULT} />
                            <Text style={styles.badgeText}>{selectedBusiness?.rating || '0.0'}</Text>
                        </View>
                        {selectedBusiness?.delivery_fee !== undefined && (
                            <View style={styles.badge}>
                                <Truck size={14} color={colors.gray[300]} />
                                <Text style={styles.badgeText}>Envío: ${selectedBusiness?.delivery_fee || 0}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );

    const renderMenu = () => (
        <View style={[styles.menuContainer, { backgroundColor: tc.bg }]}>
            {/* Categories */}
            <View style={[styles.categoriesContainer, { backgroundColor: tc.bg, borderBottomColor: tc.borderLight }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryButton,
                                selectedCategory === cat && styles.categoryButtonActive,
                                selectedCategory !== cat && { backgroundColor: tc.bgCard, borderColor: tc.borderLight }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat ? styles.categoryTextActive : { color: tc.textMuted }
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Title */}
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>{selectedCategory}</Text>
            </View>

            {/* Grid Items */}
            <View style={styles.itemsGrid}>
                {productsLoading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                        <Text style={{ color: tc.textMuted, marginTop: 10 }}>Cargando menú...</Text>
                    </View>
                ) : filteredItems.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Package size={48} color={tc.textMuted} />
                        <Text style={{ color: tc.textMuted, marginTop: 10 }}>No hay productos en esta categoría</Text>
                    </View>
                ) : (
                    filteredItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                            activeOpacity={0.9}
                        >
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImage, { backgroundColor: tc.border, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Package color={tc.textMuted} />
                                </View>
                            )}
                            <View style={styles.itemContent}>
                                <View>
                                    <Text style={[styles.itemName, { color: tc.text }]}>{item.name}</Text>
                                    <Text style={[styles.itemDesc, { color: tc.textMuted }]} numberOfLines={2}>{item.description}</Text>
                                </View>
                                <View style={styles.itemFooter}>
                                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                    <TouchableOpacity style={styles.addButton}>
                                        <Plus size={16} color={colors.primary.DEFAULT} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={isLargeScreen ? styles.layoutRow : {}}>
                    <View style={styles.mainContent}>
                        {renderHeader()}
                        {renderMenu()}
                        <View style={{ height: 100 }} />
                    </View>

                    {/* Sidebar Cart for XL Screens */}
                    {isLargeScreen && (
                        <View style={[styles.sidebarCart, { backgroundColor: tc.bgCard, borderLeftColor: tc.borderLight }]}>
                            <View style={[styles.cartHeader, { borderBottomColor: tc.borderLight }]}>
                                <Text style={[styles.cartTitle, { color: tc.text }]}>Tu Pedido</Text>
                                <Text style={[styles.cartSubtitle, { color: tc.textMuted }]}>La Parrilla Gourmet</Text>
                            </View>

                            <ScrollView style={styles.cartItems}>
                                {mockCartItem(tc, 'Empanadas de Carne', 9.00, 2, '2 unidades')}
                                {mockCartItem(tc, 'Ojo de Bife Premium', 28.00, 1, 'A punto, sin sal')}
                            </ScrollView>

                            <View style={[styles.cartFooter, { backgroundColor: tc.bgSecondary, borderTopColor: tc.borderLight }]}>
                                <View style={styles.cartSummary}>
                                    <View style={styles.summaryRow}>
                                        <Text style={{ color: tc.textMuted }}>Subtotal</Text>
                                        <Text style={{ color: tc.textMuted }}>$37.00</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={{ color: tc.textMuted }}>Envío</Text>
                                        <Text style={{ color: colors.success }}>Gratis</Text>
                                    </View>
                                    <View style={[styles.totalRow, { borderTopColor: tc.borderLight }]}>
                                        <Text style={[styles.totalText, { color: tc.text }]}>Total</Text>
                                        <Text style={[styles.totalAmount, { color: tc.text }]}>$37.00</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.checkoutButton}>
                                    <Text style={styles.checkoutText}>Ir a Pagar</Text>
                                    <View style={styles.checkoutIconBtn}>
                                        <ArrowRight size={16} color={colors.primary.DEFAULT} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function mockCartItem(tc: any, name: string, price: number, qty: number, options: string) {
    return (
        <View style={styles.cartItem}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1541745537411-b8096dc29c4e?q=80&w=200' }} style={styles.cartItemImg} />
            <View style={{ flex: 1 }}>
                <View style={styles.cartItemHeader}>
                    <Text style={[styles.cartItemName, { color: tc.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.cartItemPrice, { color: tc.text }]}>${price.toFixed(2)}</Text>
                </View>
                <Text style={[styles.cartItemOptions, { color: tc.textMuted }]}>{options}</Text>
                <View style={styles.qtyControl}>
                    <TouchableOpacity style={[styles.qtyBtn, { borderColor: tc.borderLight }]}>
                        <Minus size={12} color={tc.textMuted} />
                    </TouchableOpacity>
                    <Text style={{ color: tc.text, fontWeight: '600' }}>{qty}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, { borderColor: tc.borderLight }]}>
                        <Plus size={12} color={tc.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    layoutRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    mainContent: {
        flex: 1,
    },
    sidebarCart: {
        width: 380,
        height: 800, // Should be 100vh in web but 800 for Scrollview context
        borderLeftWidth: 1,
        // position: 'sticky', // Web only - removed for TS strictness if needed, but react native web supports it via style usually or needs View style
        top: 0
    },
    headerContainer: {
        height: 360,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backText: {
        color: 'white',
        fontWeight: '500',
    },
    navActions: {
        flexDirection: 'row',
        gap: 16,
    },
    navActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    restaurantInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 32,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 24,
    },
    logoContainer: {
        width: 96,
        height: 96,
        borderRadius: 16,
        padding: 4,
        
    },
    logo: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    infoContent: {
        flex: 1,
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        fontFamily: 'Nunito Sans',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    menuContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingTop: 32,
        paddingHorizontal: 24,
    },
    categoriesContainer: {
        // position: 'sticky',
        top: 0,
        zIndex: 5,
        borderBottomWidth: 1,
        marginHorizontal: -24,
        paddingHorizontal: 24,
        paddingBottom: 16,
        marginBottom: 24,
    },
    categoriesScroll: {
        gap: 12,
        paddingRight: 24,
    },
    categoryButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
    },
    categoryButtonActive: {
        backgroundColor: colors.primary.DEFAULT,
        borderColor: colors.primary.DEFAULT,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    sectionIndicator: {
        width: 4,
        height: 24,
        backgroundColor: colors.primary.DEFAULT,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    menuItem: {
        flexDirection: 'row',
        width: '100%', // Mobile default
        maxWidth: 600, // Tablet limit
        borderRadius: 16,
        padding: 16,
        gap: 16,
        borderWidth: 1,
    },
    itemImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: colors.gray[100],
    },
    itemContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary.DEFAULT,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartHeader: {
        padding: 24,
        borderBottomWidth: 1,
    },
    cartTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cartSubtitle: {
        fontSize: 14,
    },
    cartItems: {
        flex: 1,
        padding: 24,
    },
    cartFooter: {
        padding: 24,
        borderTopWidth: 1,
    },
    cartSummary: {
        gap: 12,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    checkoutButton: {
        backgroundColor: colors.primary.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    checkoutText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkoutIconBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 4,
        borderRadius: 8,
    },
    cartItem: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    cartItemImg: {
        width: 64,
        height: 64,
        borderRadius: 8,
    },
    cartItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    cartItemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cartItemOptions: {
        fontSize: 12,
        marginBottom: 8,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    qtyBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
