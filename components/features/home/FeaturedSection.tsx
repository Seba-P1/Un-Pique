import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Animated, Platform,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { Business } from '../../../stores/businessStore';
import { BusinessCardWide } from '../../delivery/BusinessCardWide';
import colors from '../../../constants/colors';

// ── Shimmer skeleton placeholder (taste-skill: Rule 5 — Skeletal loaders) ──
const SkeletonCard = ({ tc, index }: { tc: any; index: number }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        );
        // Stagger each skeleton card's animation start
        const timeout = setTimeout(() => loop.start(), index * 150);
        return () => {
            clearTimeout(timeout);
            loop.stop();
        };
    }, [shimmer, index]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.55],
    });

    return (
        <View style={[skeletonStyles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            <Animated.View style={[skeletonStyles.banner, { backgroundColor: tc.bgHover, opacity }]} />
            <View style={skeletonStyles.content}>
                <Animated.View style={[skeletonStyles.titleBar, { backgroundColor: tc.bgHover, opacity }]} />
                <Animated.View style={[skeletonStyles.subtitleBar, { backgroundColor: tc.bgHover, opacity }]} />
            </View>
        </View>
    );
};

// ── Skeleton styles ──
const skeletonStyles = StyleSheet.create({
    card: {
        width: 280,
        marginRight: 14,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    banner: {
        width: '100%',
        height: 160,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    content: {
        padding: 12,
        paddingTop: 28,
        gap: 8,
    },
    titleBar: {
        height: 14,
        width: '70%',
        borderRadius: 6,
    },
    subtitleBar: {
        height: 10,
        width: '45%',
        borderRadius: 6,
    },
});

interface FeaturedSectionProps {
    businesses: Business[];
    loading?: boolean;
}

export const FeaturedSection = ({ businesses = [], loading = false }: FeaturedSectionProps) => {
    const tc = useThemeColors();
    const router = useRouter();
    const { width } = useWindowDimensions();

    // Don't render section if no data and not loading
    if (!loading && businesses.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.accentDot, { backgroundColor: colors.primary.DEFAULT }]} />
                    <Text style={[styles.title, { color: tc.text }]}>Destacados</Text>
                </View>
                <Text
                    style={[styles.seeAll, { color: tc.primary }]}
                    onPress={() => router.push('/(tabs)/marketplace' as any)}
                >
                    Ver todos
                </Text>
            </View>

            {loading ? (
                <FlatList
                    horizontal
                    data={[0, 1, 2]}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => <SkeletonCard tc={tc} index={item} />}
                    keyExtractor={item => `skeleton-${item}`}
                    scrollEnabled={false}
                />
            ) : (
                <FlatList
                    horizontal
                    data={businesses}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => <BusinessCardWide business={item} />}
                    keyExtractor={item => item.id}
                    snapToInterval={294} // card width (280) + marginRight (14)
                    decelerationRate="fast"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    accentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
});
