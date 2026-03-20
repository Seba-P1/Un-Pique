import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Professional {
    id: string;
    full_name: string;
    avatar_url: string;
    specialty: string;
    rating: number;
    reviews_count: number;
    location?: string;
    hourly_rate?: number;
    description?: string;
}

interface ProfessionalCardProps {
    professional: Professional;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
    const router = useRouter();
    const tc = useThemeColors();

    const handlePress = () => {
        router.push(`/directory/${professional.id}` as any);
    };

    return (
        <TouchableOpacity
            style={[styles.card, {
                backgroundColor: tc.bgCard,
                ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
            }]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: professional.avatar_url || 'https://via.placeholder.com/150' }}
                    style={[styles.image, { backgroundColor: tc.bgInput }]}
                    resizeMode="cover"
                />
                <View style={[styles.ratingBadge, { backgroundColor: tc.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)' }]}>
                    <Star size={12} color={colors.warning} fill={colors.warning} />
                    <Text style={[styles.ratingText, { color: tc.text }]}>
                        {professional.rating?.toFixed(1) || 'Nuevo'}
                        {professional.reviews_count > 0 && ` (${professional.reviews_count})`}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.specialty, { color: tc.primary }]}>{professional.specialty || 'Profesional'}</Text>
                <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>{professional.full_name}</Text>

                {professional.location && (
                    <View style={styles.infoRow}>
                        <MapPin size={14} color={tc.textMuted} />
                        <Text style={[styles.infoText, { color: tc.textMuted }]} numberOfLines={1}>{professional.location}</Text>
                    </View>
                )}

                {professional.description && (
                    <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>
                        {professional.description}
                    </Text>
                )}

                <View style={styles.footer}>
                    <View style={styles.priceContainer}>
                        {professional.hourly_rate ? (
                            <Text style={[styles.price, { color: tc.text }]}>
                                ${professional.hourly_rate}
                                <Text style={[styles.priceUnit, { color: tc.textMuted }]}>/hr</Text>
                            </Text>
                        ) : (
                            <Text style={[styles.consultText, { color: tc.textMuted }]}>Consultar precio</Text>
                        )}
                    </View>
                    <TouchableOpacity style={[styles.bookButton, { backgroundColor: tc.bgInput }]} onPress={handlePress}>
                        <Text style={[styles.bookButtonText, { color: tc.text }]}>Ver perfil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        padding: 12,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    specialty: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        flex: 1,
    },
    description: {
        fontSize: 12,
        marginBottom: 8,
        lineHeight: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    priceUnit: {
        fontSize: 12,
        fontWeight: '400',
    },
    consultText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    bookButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bookButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
