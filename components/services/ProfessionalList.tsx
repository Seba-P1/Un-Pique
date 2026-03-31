import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ProfessionalCard } from './ProfessionalCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useListingStore } from '../../stores/listingStore';
import type { Listing } from '../../stores/listingStore';

// Mapear un Listing de Supabase al formato que espera ProfessionalCard
const listingToCardFormat = (listing: Listing) => ({
    id: listing.id,
    full_name: listing.title,
    avatar_url: listing.images?.[0] || 'https://via.placeholder.com/100',
    specialty: listing.category,
    rating: listing.rating,
    reviews_count: listing.reviews_count,
    location: listing.address || '',
    hourly_rate: listing.hourly_rate || 0,
    description: listing.description,
});

export function ProfessionalList() {
    const tc = useThemeColors();
    const { services, loading, fetchServices } = useListingStore();

    useEffect(() => {
        fetchServices();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tc.primary} />
            </View>
        );
    }

    if (services.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: tc.textMuted }]}>
                    No hay servicios publicados todavía.{'\n'}¡Sé el primero en ofrecer tu servicio!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
                Servicios disponibles
            </Text>
            {services.map(listingToCardFormat).map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 20 },
    loadingContainer: { padding: 40, alignItems: 'center' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
});
