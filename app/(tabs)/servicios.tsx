import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Text, Platform, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Briefcase, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader } from '../../components/ui/AppHeader';
import { ServiceCategories } from '../../components/services/ServiceCategories';
import { ProfessionalList } from '../../components/services/ProfessionalList';
import { AdBanner } from '../../components/features/ads/AdBanner';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';
import { useRouter } from 'expo-router';

export default function ServicesScreen() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { user } = useAuthStore();
    const router = useRouter();

    const scrollY = useRef(new Animated.Value(0)).current;

    // ── Banner entrance animations ──
    const bannerAnim = useRef(new Animated.Value(0)).current;
    const bannerScale = useRef(new Animated.Value(0.94)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(bannerAnim, {
                toValue: 1, duration: 500,
                delay: 200, useNativeDriver: true,
            }),
            Animated.spring(bannerScale, {
                toValue: 1, stiffness: 100, damping: 12,
                delay: 200, useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ── Press animation ──
    const bannerPress = useRef(new Animated.Value(1)).current;
    const handleBannerPressIn = () =>
        Animated.spring(bannerPress, { toValue: 0.97, stiffness: 200, damping: 15, useNativeDriver: true }).start();
    const handleBannerPressOut = () =>
        Animated.spring(bannerPress, { toValue: 1, stiffness: 200, damping: 15, useNativeDriver: true }).start();

    const handlePublishService = () => {
        if (!user) {
            showAlert('Iniciá sesión', 'Necesitás una cuenta para publicar tu servicio. ¡Regístrate gratis!');
            return;
        }
        router.push('/publish/service' as any);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={isDesktop ? [] : ['top']}>
            <AppHeader
                subtitle="SERVICIOS"
                title="Para tu puerta"
                leftIcon="menu"
                rightButtons={['search', 'favorites', 'messages', 'notifications']}
                scrollY={scrollY}
            />

            <Animated.ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.maxContainer, isDesktop && { maxWidth: 900 }]}>
                    <ServiceCategories />

                    {/* ══ Premium Publish Banner ══ */}
                    <Animated.View style={{
                        opacity: bannerAnim,
                        transform: [{ scale: bannerScale }],
                        marginHorizontal: isDesktop ? 0 : 16,
                        marginBottom: 24,
                        ...(isDesktop ? { width: '100%' } : {}),
                    }}>
                        <Pressable
                            onPressIn={handleBannerPressIn}
                            onPressOut={handleBannerPressOut}
                            onPress={handlePublishService}
                        >
                            <Animated.View style={[
                                {
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    transform: [{ scale: bannerPress }],
                                },
                                Platform.OS === 'web' ? {
                                    background: 'linear-gradient(135deg, #FF6B35 0%, #E8551E 50%, #FF8C42 100%)',
                                    boxShadow: '0 12px 32px rgba(255,107,53,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                                } as any : {
                                    shadowColor: '#FF6B35',
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 20,
                                    elevation: 10,
                                },
                            ]}>
                                {/* Native gradient background */}
                                {Platform.OS !== 'web' && (
                                    <LinearGradient
                                        colors={['#FF6B35', '#E8551E', '#FF8C42']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                )}

                                {/* Decorative circles */}
                                <View style={{
                                    position: 'absolute', top: -20, right: -20,
                                    width: 90, height: 90, borderRadius: 45,
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                }} />
                                <View style={{
                                    position: 'absolute', bottom: -30, right: 40,
                                    width: 60, height: 60, borderRadius: 30,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                }} />

                                {/* Content */}
                                <View style={{ padding: 16, zIndex: 2 }}>
                                    {/* Icon */}
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        justifyContent: 'center', alignItems: 'center',
                                        marginBottom: 10,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.25)',
                                    }}>
                                        <Briefcase size={20} color="#fff" />
                                    </View>

                                    {/* Text */}
                                    <Text style={{
                                        fontSize: 16, fontWeight: '700',
                                        color: '#fff', marginBottom: 4,
                                        letterSpacing: -0.3,
                                    }}>
                                        ¿Ofrecés algún servicio?
                                    </Text>
                                    <Text style={{
                                        fontSize: 13, color: 'rgba(255,255,255,0.82)',
                                        lineHeight: 18, marginBottom: 14,
                                    }}>
                                        Publicá tu oficio o servicio y llegá a miles de vecinos de Río Colorado.
                                    </Text>

                                    {/* CTA pill */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        alignSelf: 'flex-start',
                                        backgroundColor: 'rgba(255,255,255,0.18)',
                                        borderRadius: 50,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        gap: 6,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.25)',
                                    }}>
                                        <Text style={{
                                            color: '#fff', fontSize: 13, fontWeight: '700',
                                        }}>
                                            Publicar gratis
                                        </Text>
                                        <ChevronRight size={16} color="#fff" />
                                    </View>
                                </View>
                            </Animated.View>
                        </Pressable>
                    </Animated.View>

                    <View style={styles.bannerContainer}>
                        <AdBanner />
                    </View>
                    <ProfessionalList />
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingBottom: 144 },
    maxContainer: { width: '100%', maxWidth: 600 },
    bannerContainer: { marginBottom: 16 },
});
