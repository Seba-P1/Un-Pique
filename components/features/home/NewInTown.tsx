import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { Business } from '../../../stores/businessStore';
import { BusinessCardCompact } from '../../delivery/BusinessCardCompact';

interface NewInTownProps {
    businesses: Business[];
    loading?: boolean;
}

export const NewInTown = ({ businesses = [], loading = false }: NewInTownProps) => {
    const tc = useThemeColors();

    // No renderizar si no hay datos y no está cargando
    if (!loading && businesses.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Nuevo en la zona 🎉</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={tc.primary} />
                </View>
            ) : (
                <View style={[styles.listContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    {businesses.map((business) => (
                        <BusinessCardCompact key={business.id} business={business} />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    header: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    title: { fontSize: 18, fontWeight: '700' },
    listContainer: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    loadingContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
