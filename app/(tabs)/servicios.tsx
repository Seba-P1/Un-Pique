import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Text, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { AppHeader } from '../../components/ui/AppHeader';
import { ServiceCategories } from '../../components/services/ServiceCategories';
import { ProfessionalList } from '../../components/services/ProfessionalList';
import { AdBanner } from '../../components/features/ads/AdBanner';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';
import { useRouter } from 'expo-router';
import { useRef } from 'react';

export default function ServicesScreen() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { user } = useAuthStore();
    const router = useRouter();

    const scrollY = useRef(new Animated.Value(0)).current;

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
                rightButtons={['search', 'notifications']}
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
                    
                    {/* Botón de publicación movido aquí para no solapar la UI tipo FAB */}
                    <TouchableOpacity
                        style={[
                            styles.publishBanner, 
                            { backgroundColor: tc.primary + '15', borderColor: tc.primary }
                        ]}
                        onPress={handlePublishService}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.publishIconWrapper, { backgroundColor: tc.primary }]}>
                            <Plus size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.publishTitle, { color: tc.text }]}>¿Ofrecés algún servicio?</Text>
                            <Text style={[styles.publishSub, { color: tc.textMuted }]}>Publicá tu perfil y llegá a más clientes en tu zona.</Text>
                        </View>
                    </TouchableOpacity>

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
    centeredHeader: { width: '100%', maxWidth: 600, alignSelf: 'center' },
    content: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingBottom: 80 },
    maxContainer: { width: '100%', maxWidth: 600 },
    bannerContainer: { marginBottom: 16 },
    publishBanner: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, 
        borderWidth: 1, marginHorizontal: 20, marginBottom: 20, gap: 16
    },
    publishIconWrapper: {
        width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center'
    },
    publishTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    publishSub: { fontSize: 13 },
});
