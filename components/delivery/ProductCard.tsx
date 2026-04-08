import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Plus, Package } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { MarketplaceProduct } from '../../hooks/useMarketplaceData';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { LinearGradient } from 'expo-linear-gradient';

interface ProductCardProps {
    product: MarketplaceProduct;
    variant?: 'compact' | 'grid';
}

export function ProductCard({ product, variant = 'compact' }: ProductCardProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const scale = useRef(new Animated.Value(1)).current;
    const addItem = useCartStore((s) => s.addItem);
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const isFavorite = useFavoritesStore((s) => s.isFavorite(product.business_id));

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';
    const isGrid = variant === 'grid';

    // ── Navigate to product detail ────────────────────────────────
    const handleCardPress = useCallback(() => {
        router.push(`/product/${product.id}` as any);
    }, [product.id, router]);

    // ── Favorite toggle ───────────────────────────────────────────
    const handleFavorite = useCallback(() => {
        toggleFavorite(product.business_id);
    }, [product.business_id, toggleFavorite]);

    // ── Quick add to cart (qty 1, no modal) ───────────────────────
    const handleQuickAdd = useCallback(() => {
        addItem({
            productId: product.id,
            productName: product.name,
            productImage: product.image_url || undefined,
            businessId: product.business_id,
            businessName: product.business_name,
            quantity: 1,
            unitPrice: product.price,
        });
    }, [product, addItem]);

    // ── Press animations ──────────────────────────────────────────
    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    return (
        <Pressable
            onPress={handleCardPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={isGrid ? styles.pressableGrid : styles.pressableCompact}
        >
            <Animated.View style={[
                styles.card,
                {
                    backgroundColor: tc.bgCard,
                    borderColor: tc.borderLight,
                    transform: [{ scale }],
                    ...(Platform.OS === 'web'
                        ? { boxShadow: '0px 2px 10px rgba(0,0,0,0.07)' }
                        : { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 }
                    ),
                },
            ]}>
                {/* ── Product Image (1:1 aspect) ───────────────── */}
                <View style={[
                    styles.imageContainer,
                    isGrid && styles.imageContainerGrid,
                ]}>
                    {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <LinearGradient
                            colors={[primaryColor, colors.primary.dark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.imagePlaceholder}
                        >
                            <Package size={32} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    )}

                    {/* ── Glass buttons over image ─────────────── */}
                    {/* Heart — bottom left */}
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation?.();
                            handleFavorite();
                        }}
                        style={[styles.glassButton, styles.glassButtonLeft]}
                        hitSlop={6}
                    >
                        <Heart
                            size={16}
                            color="#fff"
                            fill={isFavorite ? '#FF4757' : 'transparent'}
                        />
                    </Pressable>

                    {/* Plus — bottom right */}
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation?.();
                            handleQuickAdd();
                        }}
                        style={[styles.glassButton, styles.glassButtonRight]}
                        hitSlop={6}
                    >
                        <Plus size={16} color="#fff" strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* ── Info below the image ──────────────────────── */}
                <View style={styles.content}>
                    <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                        {product.name}
                    </Text>
                    <Text style={[styles.businessName, { color: tc.textMuted }]} numberOfLines={1}>
                        {product.business_name}
                    </Text>
                    <Text style={styles.price}>
                        ${product.price.toLocaleString('es-AR')}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    // ── Pressable wrappers ────────────────────────────────────────
    pressableCompact: {
        width: 160,
        marginRight: 12,
    },
    pressableGrid: {
        flex: 1,
        maxWidth: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },

    // ── Card ──────────────────────────────────────────────────────
    card: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
    },

    // ── Image (1:1 aspect ratio) ──────────────────────────────────
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        position: 'relative',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
    },
    imageContainerGrid: {
        // Grid cards can be slightly taller — keep 1:1 via aspectRatio
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Glass buttons ─────────────────────────────────────────────
    glassButton: {
        position: 'absolute',
        bottom: 8,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 50,
        padding: 8,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
            } as any,
            default: {},
        }),
    },
    glassButtonLeft: {
        left: 8,
    },
    glassButtonRight: {
        right: 8,
    },

    // ── Content area ──────────────────────────────────────────────
    content: {
        padding: 10,
        paddingTop: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        marginBottom: 2,
    },
    businessName: {
        fontSize: 12,
        fontFamily: 'Nunito Sans',
        marginBottom: 4,
    },
    price: {
        fontSize: 15,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        color: '#FF6B35',
    },
});
