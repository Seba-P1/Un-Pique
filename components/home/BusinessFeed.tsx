import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useLocationStore } from '../../stores/locationStore';
import { useBusinessStore, Business } from '../../stores/businessStore';
import { useBusinesses } from '../../hooks/useBusinesses';
import { Card } from '../ui';
import { BusinessCardSkeleton } from '../ui/Skeleton';
import { useThemeColors } from '../../hooks/useThemeColors';

export const BusinessFeed = () => {
    const tc = useThemeColors();
    const router = useRouter();
    const { currentLocality } = useLocationStore();
    const { data: businesses = [], isLoading: loading, refetch, isRefetching } = useBusinesses(currentLocality?.id);
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

    const renderItem = ({ item }: { item: Business }) => (
        <Card variant="elevated" style={StyleSheet.flatten([styles.card, { backgroundColor: tc.bgCard }])} onPress={() => router.push(`/shop/${item.slug || item.id}` as any)}>
            <View style={[styles.imageContainer, { backgroundColor: tc.bgInput }]}>
                <Image
                    source={{ uri: item.cover_url || item.logo_url || 'https://via.placeholder.com/300' }}
                    style={styles.banner}
                />
                {!item.is_open && (
                    <View style={styles.closedBadge}>
                        <Text style={styles.closedText}>Cerrado</Text>
                    </View>
                )}
                <View style={styles.ratingBadge}>
                    <Star size={12} color={colors.white} fill={colors.white} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.header}>
                    <Text style={[styles.name, { color: tc.text }]}>{item.name}</Text>
                </View>
                <Text style={[styles.category, { color: tc.textSecondary }]}>{item.category}</Text>

                <View style={styles.metaRow}>
                    <View style={[styles.metaItem, { backgroundColor: tc.bgHover }]}>
                        <Clock size={14} color={tc.textMuted} />
                        <Text style={[styles.metaText, { color: tc.textSecondary }]}>{item.delivery_time}</Text>
                    </View>
                    <View style={[styles.metaItem, { backgroundColor: tc.bgHover }]}>
                        <Text style={styles.deliveryFee}>Envío ${item.delivery_fee}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.feedHeader}>
                <Text style={[styles.sectionTitle, { color: tc.text }]}>Comercios en {currentLocality?.name}</Text>
            </View>

            {(loading && !refreshing && businesses.length === 0) ? (
                <View style={[styles.list, { gap }]}>
                    <BusinessCardSkeleton />
                    <BusinessCardSkeleton />
                    <BusinessCardSkeleton />
                </View>
            ) : (
                <View style={[styles.list, { gap }]}>
                    {businesses.map((b) => (
                        <View key={b.id} style={[styles.wrapper, { width: itemWidth as any }]}>
                            {renderItem({ item: b })}
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
    wrapper: {
        marginBottom: 16,
    },
    card: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: 16,
    },
    imageContainer: {
        height: 140,
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    closedBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closedText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 12,
    },
    info: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
    },
    category: {
        fontSize: 14,
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    deliveryFee: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '600',
    },
});
