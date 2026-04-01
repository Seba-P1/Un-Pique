import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocationStore } from '../../stores/locationStore';
import { useBusinessStore, Business } from '../../stores/businessStore';
import { useBusinesses } from '../../hooks/useBusinesses';
import { BusinessCardSkeleton } from '../ui/Skeleton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { BusinessCard } from '../delivery/BusinessCard';

export const BusinessFeed = () => {
    const tc = useThemeColors();
    const { currentLocality } = useLocationStore();
    const { data: businesses = [], isLoading: loading } = useBusinesses(currentLocality?.id);
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    
    const isDesktop = width >= 768;
    const numColumns = isDesktop ? 3 : 1;
    const gap = 16;
    const padding = 20;

    const maxDesktopWidth = 1024;
    const containerWidth = Math.min(width, maxDesktopWidth);
    const effectiveWidth = containerWidth - (padding * 2);

    const itemWidth = isDesktop
        ? (effectiveWidth - (gap * (numColumns - 1))) / numColumns
        : '100%';

    return (
        <View style={styles.container}>
            <View style={styles.feedHeader}>
                <Text style={[styles.sectionTitle, { color: tc.text }]}>Comercios en {currentLocality?.name}</Text>
            </View>

            {(loading && !refreshing && businesses.length === 0) ? (
                <View style={[styles.list, { gap }]}>
                    <View style={{ width: itemWidth as any, marginBottom: 16 }}>
                        <BusinessCardSkeleton />
                    </View>
                    <View style={{ width: itemWidth as any, marginBottom: 16 }}>
                        <BusinessCardSkeleton />
                    </View>
                    <View style={{ width: itemWidth as any, marginBottom: 16 }}>
                        <BusinessCardSkeleton />
                    </View>
                </View>
            ) : (
                <View style={[styles.list, { gap }]}>
                    {businesses.map((b) => (
                        <View key={b.id} style={{ width: itemWidth as any, marginBottom: 16 }}>
                            <BusinessCard business={b} />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 24,
        paddingBottom: 40,
        width: '100%',
    },
    feedHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    list: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
});
