import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle, DimensionValue } from 'react-native';
import colors from '../../constants/colors';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style
            ]}
        />
    );
};

export const BusinessCardSkeleton = () => {
    return (
        <View style={styles.cardContainer}>
            <Skeleton height={160} borderRadius={16} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <Skeleton width={40} height={16} />
                <Skeleton width={80} height={16} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton style={{ flex: 1 }} height={44} borderRadius={8} />
                <Skeleton style={{ flex: 1 }} height={44} borderRadius={8} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.gray[200],
    },
    cardContainer: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
        
    }
});
