// app/index.tsx (Splash Screen) — Solo logo centrado, fondo oscuro con organic radial glow
import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const { initialize } = useAuthStore();
    const [hasNavigated, setHasNavigated] = useState(false);

    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.7)).current;
    const pulse1 = useRef(new Animated.Value(0.4)).current;
    const pulse2 = useRef(new Animated.Value(0.2)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (hasNavigated) return;

        // Logo entrance
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 8, tension: 20, useNativeDriver: true }),
        ]).start();

        // Organic glow pulse 1
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse1, { toValue: 0.8, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse1, { toValue: 0.4, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        // Organic glow pulse 2 (offset)
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse2, { toValue: 0.5, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse2, { toValue: 0.2, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        // Slow floating motion
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

        // Navigation flow
        const checkFlow = async () => {
            try {
                // Wait for the minimum animation duration
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Initialize auth, but catch errors to prevent hanging
                await initialize().catch(err => console.warn('Auth initialization error:', err));

                const currentUser = useAuthStore.getState().user;
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding').catch(() => null);

                setHasNavigated(true);

                if (!hasSeenOnboarding) {
                    router.replace('/onboarding');
                    return;
                }

                if (currentUser) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/login');
                }
            } catch (error) {
                console.error("Critical error during splash flow:", error);
                setHasNavigated(true);
                router.replace('/(auth)/login'); // Emergency fallback
            }
        };

        checkFlow();
    }, [hasNavigated]);

    const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
    const floatX1 = float1.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });

    const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [40, -40] });
    const floatX2 = float2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });

    return (
        <View style={styles.container}>
            {/* Base dark background */}
            <View style={styles.bgDark} />

            {/* Organic Glows - Circles with extremely blurred edges simulated via opacity gradients if native, or pure box-shadow blur on web */}
            <Animated.View style={[
                styles.glowOrb1,
                { opacity: pulse1, transform: [{ translateX: floatX1 }, { translateY: floatY1 }] }
            ]} />

            <Animated.View style={[
                styles.glowOrb2,
                { opacity: pulse2, transform: [{ translateX: floatX2 }, { translateY: floatY2 }] }
            ]} />

            {/* Logo — solo, centrado, grande */}
            <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}>
                <Image
                    source={require('../public/logo_un-pique.svg')}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );
}

const ORB_SIZE = Math.max(width, height) * 0.8;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bgDark: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0D0D0D', // Deep black/gray
    },
    glowOrb1: {
        position: 'absolute',
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
        backgroundColor: '#FF6B35', // Primary orange
        top: '10%',
        left: '-10%',
        ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : { shadowColor: '#FF6B35', shadowRadius: 100, shadowOpacity: 1 }),
    },
    glowOrb2: {
        position: 'absolute',
        width: ORB_SIZE * 0.8,
        height: ORB_SIZE * 0.8,
        borderRadius: (ORB_SIZE * 0.8) / 2,
        backgroundColor: '#FF8C32', // Slightly lighter orange
        bottom: '5%',
        right: '-15%',
        ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } : { shadowColor: '#FF8C32', shadowRadius: 120, shadowOpacity: 1 }),
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logo: {
        width: 280,
        height: 280,
    },
});
