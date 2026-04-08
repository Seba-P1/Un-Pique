import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Bike, MapPin } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Business } from '../../stores/businessStore';
import { checkIsBusinessOpen } from '../../utils/schedule';
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
    other: 'Otros',
};

interface BusinessCardMiniProps {
    business: Business;
}

export function BusinessCardMini({ business }: BusinessCardMiniProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const scale = useRef(new Animated.Value(1)).current;

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';
    const isOpen = business.is_open && checkIsBusinessOpen(business.schedule);
    const coverUri = business.cover_url || business.image;
    const logoUri = business.logo_url;
    const mappedCategory = CATEGORY_MAP[business.category] || business.category || 'Otros';

    const handlePress = () => {
        router.push(`/shop/${business.slug || business.id}` as any);
    };

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.pressable}
        >
            <Animated.View style={[
                styles.card,
                {
                    backgroundColor: tc.bgCard,
                    borderColor: tc.borderLight,
                    transform: [{ scale }],
                    ...(Platform.OS === 'web'
                        ? { boxShadow: '0px 3px 12px rgba(0,0,0,0.08)' }
                        : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 }
                    ),
                },
            ]}>
                {/* Cover Image */}
                <View style={[styles.imageContainer, !coverUri && { backgroundColor: primaryColor }]}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
                    ) : null}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.gradient} />

                    {/* Status badge */}
                    <View style={isOpen ? styles.openBadge : styles.closedBadge}>
                        <Text style={isOpen ? styles.openText : styles.closedText}>
                            {isOpen ? 'Abierto' : 'Cerrado'}
                        </Text>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoWrap}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.logoImg} />
                        ) : (
                            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
                                <Text style={styles.logoInitial}>{business.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                        {business.name}
                    </Text>
                    <Text style={[styles.category, { color: tc.textSecondary }]} numberOfLines={1}>
                        {mappedCategory}
                    </Text>

                    <View style={styles.metaRow}>
                        {business.rating > 0 && (
                            <View style={styles.ratingWrap}>
                                <Star size={11} color={primaryColor} fill={primaryColor} />
                                <Text style={[styles.ratingText, { color: tc.text }]}>
                                    {typeof business.rating === 'number' ? business.rating.toFixed(1) : '0.0'}
                                </Text>
                            </View>
                        )}
                        {business.accepts_delivery && (
                            <View style={[styles.tagPill, { backgroundColor: tc.bgHover }]}>
                                <Bike color="#22c55e" size={10} />
                                <Text style={[styles.tagText, { color: tc.textSecondary }]}>Delivery</Text>
                            </View>
                        )}
                        {!business.accepts_delivery && business.has_pickup && (
                            <View style={[styles.tagPill, { backgroundColor: tc.bgHover }]}>
                                <MapPin size={10} color={tc.textMuted} />
                                <Text style={[styles.tagText, { color: tc.textSecondary }]}>Retiro</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        width: 200,
        marginRight: 14,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    imageContainer: {
        width: '100%',
        height: 120,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
    },
    openBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#1a4a1a',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    openText: {
        color: '#4ade80',
        fontSize: 9,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        letterSpacing: 0.4,
    },
    closedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#4a1a1a',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    closedText: {
        color: '#f87171',
        fontSize: 9,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        letterSpacing: 0.4,
    },
    logoWrap: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImg: {
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
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    content: {
        padding: 12,
        paddingTop: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 2,
    },
    category: {
        fontSize: 12,
        fontFamily: 'Nunito Sans',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
});
