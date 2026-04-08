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
    furniture: 'Muebles',
    beauty_salon: 'Salón de Belleza',
    barbershop: 'Barbería',
    spa: 'Spa',
    gym: 'Gimnasio',
    auto_repair: 'Mecánica',
    auto_parts: 'Repuestos',
    health_clinic: 'Clínica',
    dentist: 'Odontología',
    veterinary: 'Veterinaria',
    laundry: 'Lavandería',
    hardware_store: 'Ferretería',
    bookstore: 'Librería',
    toys: 'Juguetería',
    pets: 'Mascotas',
    services: 'Servicios',
    other: 'Otros',
};

interface BusinessCardWideProps {
    business: Business;
}

export function BusinessCardWide({ business }: BusinessCardWideProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const scale = useRef(new Animated.Value(1)).current;

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';
    const isOpen = business.is_open && checkIsBusinessOpen(business.schedule);
    const coverUri = business.cover_url || (business as any).image;
    const logoUri = business.logo_url;
    const mappedCategory = CATEGORY_MAP[business.category] || business.category || 'Otros';

    const handlePress = () => {
        router.push(`/shop/${business.slug || business.id}` as any);
    };

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: Platform.OS !== 'web' }).start();
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
                        ? { boxShadow: '0px 3px 12px rgba(0,0,0,0.12)' }
                        : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 }
                    ),
                },
            ]}>
                {/* Banner / Cover */}
                <View style={styles.bannerContainer}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                        <LinearGradient
                            colors={['#FF6B35', '#cc4400']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bannerImage}
                        />
                    )}

                    {/* Status badge */}
                    <View style={isOpen ? styles.openBadge : styles.closedBadge}>
                        <Text style={isOpen ? styles.openText : styles.closedText}>
                            {isOpen ? 'Abierto' : 'Cerrado'}
                        </Text>
                    </View>

                    {/* Logo superpuesto en bottom-left */}
                    <View style={[styles.logoWrap, { backgroundColor: tc.bgCard }]}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.logoImg} resizeMode="cover" />
                        ) : (
                            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
                                <Text style={styles.logoInitial}>
                                    {business.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info */}
                <View style={styles.content}>
                    <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                        {business.name}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={[styles.category, { color: tc.textSecondary }]} numberOfLines={1}>
                            {mappedCategory}
                        </Text>

                        {business.accepts_delivery && (
                            <>
                                <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                                <View style={styles.deliveryBadge}>
                                    <Bike size={11} color="#22c55e" />
                                    <Text style={[styles.deliveryText, { color: tc.textSecondary }]}>
                                        {business.delivery_fee === 0
                                            ? 'Envío gratis'
                                            : `Envío $${business.delivery_fee}`}
                                    </Text>
                                </View>
                            </>
                        )}

                        {!business.accepts_delivery && business.has_pickup && (
                            <>
                                <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                                <View style={styles.deliveryBadge}>
                                    <MapPin size={11} color={tc.textMuted} />
                                    <Text style={[styles.deliveryText, { color: tc.textSecondary }]}>
                                        Retiro en local
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {typeof business.rating === 'number' && business.rating > 0 && (
                        <View style={[styles.ratingBadge, { backgroundColor: primaryColor }]}>
                            <Text style={styles.ratingText}>⭐ {business.rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        width: 280,
        marginRight: 14,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    bannerContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    openBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        zIndex: 2,
    },
    openText: {
        color: '#4ade80',
        fontSize: 10,
        fontWeight: '700',
    },
    closedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#3a1a1a',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        zIndex: 2,
    },
    closedText: {
        color: '#f87171',
        fontSize: 10,
        fontWeight: '700',
    },
    logoWrap: {
        position: 'absolute',
        bottom: -20,
        left: 12,
        width: 56,
        height: 56,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInitial: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 28, // espacio para el logo superpuesto
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    category: {
        fontSize: 13,
    },
    dot: {
        fontSize: 13,
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    deliveryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    ratingBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    ratingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
