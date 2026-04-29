import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Pressable, Animated, Platform,
    LayoutAnimation, UIManager,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { Business } from '../../../stores/businessStore';
import { BusinessCardCompact } from '../../delivery/BusinessCardCompact';
import colors from '../../../constants/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_SHOW = 4;

// ── Shimmer skeleton row (taste-skill: Rule 5 — Skeletal loaders) ──
const SkeletonRow = ({ tc, index }: { tc: any; index: number }) => {
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
        const timeout = setTimeout(() => loop.start(), index * 120);
        return () => {
            clearTimeout(timeout);
            loop.stop();
        };
    }, [shimmer, index]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.5],
    });

    return (
        <View style={skeletonStyles.row}>
            <Animated.View style={[skeletonStyles.avatar, { backgroundColor: tc.bgHover, opacity }]} />
            <View style={skeletonStyles.lines}>
                <Animated.View style={[skeletonStyles.titleBar, { backgroundColor: tc.bgHover, opacity }]} />
                <Animated.View style={[skeletonStyles.subtitleBar, { backgroundColor: tc.bgHover, opacity }]} />
                <Animated.View style={[skeletonStyles.metaBar, { backgroundColor: tc.bgHover, opacity }]} />
            </View>
        </View>
    );
};

const skeletonStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.08)',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },
    lines: {
        flex: 1,
        marginLeft: 12,
        gap: 6,
    },
    titleBar: {
        height: 14,
        width: '55%',
        borderRadius: 6,
    },
    subtitleBar: {
        height: 10,
        width: '35%',
        borderRadius: 6,
    },
    metaBar: {
        height: 10,
        width: '60%',
        borderRadius: 6,
    },
});

interface NewInTownProps {
    businesses: Business[];
    loading?: boolean;
}

export const NewInTown = ({ businesses = [], loading = false }: NewInTownProps) => {
    const tc = useThemeColors();
    const [expanded, setExpanded] = useState(false);

    // Don't render section if no data and not loading
    if (!loading && businesses.length === 0) return null;

    const visibleBusinesses = expanded ? businesses : businesses.slice(0, INITIAL_SHOW);
    const hasMore = businesses.length > INITIAL_SHOW;

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(
                280,
                LayoutAnimation.Types.easeInEaseOut,
                LayoutAnimation.Properties.opacity
            )
        );
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.accentDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.title, { color: tc.text }]}>Nuevo en la zona</Text>
                </View>
            </View>

            {loading ? (
                <View style={[styles.listContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    {[0, 1, 2, 3].map((i) => (
                        <SkeletonRow key={`skeleton-row-${i}`} tc={tc} index={i} />
                    ))}
                </View>
            ) : (
                <View style={[styles.listContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    {visibleBusinesses.map((business) => (
                        <BusinessCardCompact key={business.id} business={business} />
                    ))}

                    {hasMore && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.toggleButton,
                                { borderTopColor: tc.borderLight },
                                pressed && { opacity: 0.7 },
                            ]}
                            onPress={toggleExpanded}
                        >
                            {expanded ? (
                                <ChevronUp size={16} color={tc.primary} strokeWidth={2.5} />
                            ) : (
                                <ChevronDown size={16} color={tc.primary} strokeWidth={2.5} />
                            )}
                            <Text style={[styles.toggleText, { color: tc.primary }]}>
                                {expanded ? 'Ver menos' : `Ver ${businesses.length - INITIAL_SHOW} más`}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    header: {
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
    listContainer: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
        borderTopWidth: 1,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
});
