import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Star, MapPin, Heart } from 'lucide-react-native';
import { checkIsBusinessOpen } from '../../utils/schedule';
import { colors } from '../../constants/colors';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useThemeColors } from '../../hooks/useThemeColors';

interface BusinessCardProps {
    business: {
        id: string;
        name: string;
        slug: string;
        description: string;
        image_url: string;
        category: string;
        rating: number;
        delivery_time: string;
        delivery_fee: number;
        min_order: number;
        is_open: boolean;
        schedule?: any;
    };
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
        router.push(`/marketplace/restaurant/${business.id}` as any);
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
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: business.image_url || 'https://via.placeholder.com/400x200' }}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    {/* Dark gradient overlay at top for better icon visibility */}
                    <View style={styles.imageGradientTop} />

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
                    {!isOpen && (
                        <View style={styles.closedBadge}>
                            <Text style={styles.closedText}>Cerrado</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                            {business.name}
                        </Text>
                        <View style={styles.ratingBadgePremium}>
                            <Star size={12} color={colors.white} fill={colors.white} />
                            <Text style={styles.ratingTextPremium}>{business.rating.toFixed(1)}</Text>
                        </View>
                    </View>

                    <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>
                        {business.description}
                    </Text>

                    <View style={styles.infoRow}>
                        <View style={[styles.infoItem, { backgroundColor: tc.bgHover }]}>
                            <Clock size={12} color={tc.textMuted} />
                            <Text style={[styles.infoText, { color: tc.textSecondary }]}>{business.delivery_time}</Text>
                        </View>
                        <View style={[styles.infoItem, { backgroundColor: tc.bgHover }]}>
                            <MapPin size={12} color={tc.textMuted} />
                            <Text style={[styles.infoText, { color: tc.textSecondary }]}>
                                ${business.delivery_fee === 0 ? 'Envío Gratis' : `${business.delivery_fee}`}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.categoryBadge, { backgroundColor: 'transparent', borderColor: tc.borderLight }]}>
                        <Text style={[styles.categoryText, { color: tc.textSecondary }]}>{business.category}</Text>
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
    imageContainer: { width: '100%', height: 160, position: 'relative' },
    image: { width: '100%', height: '100%' },
    imageGradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.2)', // Subtle gradient effect replacement
    },
    favoriteButton: {
        position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center',
        zIndex: 10,
    },
    closedBadge: {
        position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(239, 35, 60, 0.9)', // danger with alpha
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    },
    closedText: { color: colors.white, fontSize: 11, fontWeight: '700', fontFamily: 'Nunito Sans', letterSpacing: 0.5 },
    content: { padding: 16, paddingTop: 14 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    name: { fontSize: 17, fontWeight: '800', fontFamily: 'Nunito Sans', flex: 1, marginRight: 8 },
    ratingBadgePremium: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingTextPremium: { color: colors.white, fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },
    description: { fontSize: 13, marginBottom: 14, lineHeight: 18, fontFamily: 'Nunito Sans' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    infoText: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    categoryText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', fontFamily: 'Nunito Sans' },
});
