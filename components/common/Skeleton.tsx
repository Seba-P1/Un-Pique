import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import colors from '../../constants/colors';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style,
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Skeleton presets
export const SkeletonCard: React.FC = () => (
    <View style={styles.card}>
        <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Skeleton width="30%" height={16} />
            <Skeleton width="40%" height={32} borderRadius={8} />
        </View>
    </View>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <View>
        {Array.from({ length: items }).map((_, index) => (
            <View key={index} style={styles.listItem}>
                <Skeleton width={60} height={60} borderRadius={8} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="50%" height={14} />
                </View>
            </View>
        ))}
    </View>
);

export const SkeletonProductGrid: React.FC<{ items?: number }> = ({ items = 6 }) => (
    <View style={styles.grid}>
        {Array.from({ length: items }).map((_, index) => (
            <View key={index} style={styles.gridItem}>
                <Skeleton width="100%" height={120} borderRadius={8} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="60%" height={12} />
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.gray[200],
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: 8,
        padding: 8,
    },
});
