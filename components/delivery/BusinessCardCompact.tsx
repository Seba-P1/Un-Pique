import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, MapPin } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Business } from '../../stores/businessStore';
import { checkIsBusinessOpen } from '../../utils/schedule';

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

interface BusinessCardCompactProps {
    business: Business;
}

export function BusinessCardCompact({ business }: BusinessCardCompactProps) {
    const tc = useThemeColors();
    const router = useRouter();

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';
    const isOpen = business.is_open && checkIsBusinessOpen(business.schedule);
    const logoUri = business.logo_url;
    const mappedCategory = CATEGORY_MAP[business.category] || business.category || 'Otros';

    const handlePress = () => {
        router.push(`/shop/${business.slug || business.id}` as any);
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.pressable,
                pressed && { opacity: 0.85 },
            ]}
        >
            {/* Logo */}
            <View style={[styles.logoWrap, { backgroundColor: tc.bgHover }]}>
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

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                    {business.name}
                </Text>
                <Text style={[styles.category, { color: tc.textMuted }]} numberOfLines={1}>
                    {mappedCategory}
                </Text>

                {/* Meta row */}
                <View style={styles.metaRow}>
                    {typeof business.rating === 'number' && business.rating > 0 && (
                        <>
                            <Text style={[styles.metaText, { color: tc.textSecondary }]}>
                                ⭐ {business.rating.toFixed(1)}
                            </Text>
                            <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                        </>
                    )}

                    {business.accepts_delivery ? (
                        <View style={styles.inlineRow}>
                            <Bike size={11} color="#22c55e" />
                            <Text style={[styles.metaText, { color: tc.textSecondary }]}>
                                {business.delivery_fee === 0
                                    ? 'Envío gratis'
                                    : `Envío $${business.delivery_fee}`}
                            </Text>
                        </View>
                    ) : business.has_pickup ? (
                        <View style={styles.inlineRow}>
                            <MapPin size={11} color={tc.textMuted} />
                            <Text style={[styles.metaText, { color: tc.textSecondary }]}>
                                Retiro en local
                            </Text>
                        </View>
                    ) : null}

                    <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                    <View style={isOpen ? styles.openDot : styles.closedDot} />
                    <Text style={[styles.metaText, { color: isOpen ? '#4ade80' : '#f87171' }]}>
                        {isOpen ? 'Abierto' : 'Cerrado'}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.12)',
    },
    logoWrap: {
        width: 60,
        height: 60,
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingLeft: 12,
        gap: 2,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
    },
    category: {
        fontSize: 13,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flexWrap: 'wrap',
        marginTop: 2,
    },
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 12,
    },
    dot: {
        fontSize: 12,
    },
    openDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    closedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f87171',
    },
});
