import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export function SplashScreen() {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.7)).current;
    const pulse1 = useRef(new Animated.Value(0.4)).current;
    const pulse2 = useRef(new Animated.Value(0.2)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 8, tension: 20, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse1, { toValue: 0.8, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse1, { toValue: 0.4, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse2, { toValue: 0.5, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse2, { toValue: 0.2, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(float1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(float2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
    const floatX1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
    const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [40, -40] });
    const floatX2 = float2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });

    return (
        <View style={styles.container}>
            <View style={styles.bgDark} />

            <Animated.View style={[
                styles.glowOrb1,
                { opacity: pulse1, transform: [{ translateX: floatX1 }, { translateY: floatY1 }] }
            ]} />

            <Animated.View style={[
                styles.glowOrb2,
                { opacity: pulse2, transform: [{ translateX: floatX2 }, { translateY: floatY2 }] }
            ]} />

            <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}>
                <Image
                    source={require('../../public/logo_un-pique.svg')}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );
}

const ORB_SIZE = Math.max(width, height) * 0.8;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    bgDark: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0D0D0D' },
    glowOrb1: {
        position: 'absolute', width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2, backgroundColor: '#FF6B35',
        top: '10%', left: '-10%',
        ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : { shadowColor: '#FF6B35', shadowRadius: 100, shadowOpacity: 1 }),
    },
    glowOrb2: {
        position: 'absolute', width: ORB_SIZE * 0.8, height: ORB_SIZE * 0.8, borderRadius: (ORB_SIZE * 0.8) / 2, backgroundColor: '#FF8C32',
        bottom: '5%', right: '-15%',
        ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } : { shadowColor: '#FF8C32', shadowRadius: 120, shadowOpacity: 1 }),
    },
    logoContainer: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    logo: { width: 280, height: 280 },
});
