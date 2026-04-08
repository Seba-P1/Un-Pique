import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, MapPin, Heart } from 'lucide-react-native';
import { checkIsBusinessOpen } from '../../utils/schedule';
import { colors } from '../../constants/colors';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Business } from '../../stores/businessStore';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORY_MAP: Record<string, string> = {
    restaurant: 'Restaurante',
    cafe: 'Café',
    bakery: 'Panadería',
    pharmacy: 'Farmacia',
    supermarket: 'Supermercado',
    minimarket: 'Minimercado',
    clothing: 'Ropa',
    shoes: 'Calzado',
    electronics: 'Electrónica',
    gym: 'Gimnasio',
    beauty_salon: 'Salón de Belleza',
    barbershop: 'Barbería',
    other: 'Otros'
};

interface BusinessCardProps {
    business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const [isTogglingFavorite, setIsTogglingFavorite] = React.useState(false);

    const liked = isFavorite(business.id);
    const isOpen = business.is_open && checkIsBusinessOpen(business.schedule);

    // Shared animated value for scale and shadow
    const scale = useRef(new Animated.Value(1)).current;
    const shadowOpacity = useRef(new Animated.Value(0.08)).current;

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';

    const handlePress = () => {
        router.push(`/shop/${business.slug || business.id}` as any);
    };

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handleHoverIn = () => {
        if (Platform.OS === 'web') {
            Animated.parallel([
                Animated.spring(scale, { toValue: 1.01, useNativeDriver: false }),
                Animated.timing(shadowOpacity, { toValue: 0.15, duration: 250, useNativeDriver: false })
            ]).start();
        }
    };

    const handleHoverOut = () => {
        if (Platform.OS === 'web') {
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: false }),
                Animated.timing(shadowOpacity, { toValue: 0.08, duration: 250, useNativeDriver: false })
            ]).start();
        }
    };

    const handleFavoritePress = async (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        setIsTogglingFavorite(true);
        try {
            await toggleFavorite(business.id);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    const coverUri = business.cover_url || business.image;
    const logoUri = business.logo_url;
    const mappedCategory = CATEGORY_MAP[business.category] || business.category || 'Otros';

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            // @ts-ignore
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={({ pressed }) => [styles.pressableWrapper, { opacity: pressed && Platform.OS !== 'web' ? 0.95 : 1 }]}
        >
            <Animated.View style={[
                styles.card,
                {
                    backgroundColor: tc.bgCard,
                    borderColor: tc.borderLight,
                    transform: [{ scale }],
                    ...(Platform.OS === 'web' ? {
                        boxShadow: shadowOpacity.interpolate({
                            inputRange: [0.08, 0.15],
                            outputRange: ['0px 4px 16px rgba(0,0,0,0.08)', '0px 8px 24px rgba(0,0,0,0.15)']
                        })
                    } : {
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: shadowOpacity as unknown as number,
                        shadowRadius: 12,
                    })
                }
            ]}>
                <View style={[styles.imageContainer, !coverUri && { backgroundColor: primaryColor }]}>
                    {coverUri ? (
                        <Image
                            source={{ uri: coverUri }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : null}

                    {/* Gradient overlay from transparent to 60% black */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.gradientOverlay}
                    />

                    {/* Like button top right */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.favoriteButton,
                            pressed && { transform: [{ scale: 0.9 }] }
                        ]}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        onPress={handleFavoritePress}
                        disabled={isTogglingFavorite}
                    >
                        <Heart
                            size={18}
                            color={liked ? primaryColor : colors.white}
                            fill={liked ? primaryColor : 'transparent'}
                        />
                    </Pressable>

                    {/* Status badge top left */}
                    <View style={isOpen ? styles.openBadge : styles.closedBadge}>
                        <Text style={isOpen ? styles.openText : styles.closedText}>
                            {isOpen ? 'Abierto' : 'Cerrado'}
                        </Text>
                    </View>

                    {/* Logo inner bottom left */}
                    <View style={styles.logoContainer}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.logoImage} />
                        ) : (
                            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
                                <Text style={styles.logoInitial}>
                                    {business.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                            {business.name}
                        </Text>
                        <View style={[styles.ratingBadge, { backgroundColor: primaryColor }]}>
                            <Star size={12} color={colors.white} fill={colors.white} />
                            <Text style={styles.ratingText}>
                                {typeof business.rating === 'number' ? business.rating.toFixed(1) : parseFloat(business.rating || 0).toFixed(1)}
                            </Text>
                        </View>
                    </View>

                    {/* Category row */}
                    <Text style={[styles.categoryText, { color: tc.textSecondary }]} numberOfLines={1}>
                        {mappedCategory}
                    </Text>

                    <View style={styles.infoRow}>
                        {business.has_delivery && (
                            <View style={[styles.infoItem, { backgroundColor: tc.bgHover }]}>
                                <Text style={[styles.infoText, { color: tc.textSecondary }]}>
                                    {business.delivery_fee === 0 ? 'Envío Gratis' : `Envío $${business.delivery_fee}`}
                                </Text>
                            </View>
                        )}
                        {!business.has_delivery && business.has_pickup && (
                            <View style={[styles.infoItem, { backgroundColor: tc.bgHover }]}>
                                <MapPin size={12} color={tc.textMuted} />
                                <Text style={[styles.infoText, { color: tc.textSecondary }]}>
                                    Retiro en local
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressableWrapper: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%', // Matches bottom-up gradient design
    },
    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    openBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#1a4a1a', // Dark green matching requirements
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 10,
    },
    openText: {
        color: '#4ade80', // Light green
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        letterSpacing: 0.5,
    },
    closedBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#4a1a1a', // Dark red matching requirements
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 10,
    },
    closedText: {
        color: '#f87171', // Light red
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        letterSpacing: 0.5,
    },
    logoContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ffffff',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInitial: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    content: {
        padding: 16,
        paddingTop: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 17,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    categoryText: {
        fontSize: 14,
        marginBottom: 12,
        fontFamily: 'Nunito Sans',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
});
