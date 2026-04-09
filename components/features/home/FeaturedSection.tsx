import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { Business } from '../../../stores/businessStore';
import { BusinessCardWide } from '../../delivery/BusinessCardWide';

interface FeaturedSectionProps {
    businesses: Business[];
    loading?: boolean;
}

export const FeaturedSection = ({ businesses = [], loading = false }: FeaturedSectionProps) => {
    const tc = useThemeColors();
    const router = useRouter();

    // No renderizar si no hay datos y no está cargando
    if (!loading && businesses.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Destacados ⭐</Text>
                <Text
                    style={[styles.seeAll, { color: tc.primary }]}
                    onPress={() => router.push('/(tabs)/marketplace' as any)}
                >
                    Ver todos
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={tc.primary} />
                </View>
            ) : (
                <FlatList
                    horizontal
                    data={businesses}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => <BusinessCardWide business={item} />}
                    keyExtractor={item => item.id}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    title: { fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    listContent: { paddingHorizontal: 16 },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
