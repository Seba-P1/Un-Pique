import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { HeaderTypeA } from '../../components/ui/Header';
import { ServiceCategories } from '../../components/services/ServiceCategories';
import { ProfessionalList } from '../../components/services/ProfessionalList';
import { AdBanner } from '../../components/features/ads/AdBanner';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';

export default function ServicesScreen() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { user } = useAuthStore();

    const handlePublishService = () => {
        if (!user) {
            showAlert('Iniciá sesión', 'Necesitás una cuenta para publicar tu servicio. ¡Regístrate gratis!');
            return;
        }
        showAlert('Publicar servicio', 'Próximamente vas a poder ofrecer tus servicios profesionales a todo tu barrio desde acá. ¡Estamos trabajando en ello!');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={isDesktop ? [] : ['top']}>
            <View style={[styles.centeredHeader, isDesktop && { maxWidth: 900 }]}>
                <HeaderTypeA title="Servicios" subtitle="Profesionales de tu barrio" />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.maxContainer, isDesktop && { maxWidth: 900 }]}>
                    <ServiceCategories />
                    <View style={styles.bannerContainer}>
                        <AdBanner />
                    </View>
                    <ProfessionalList />
                </View>
            </ScrollView>

            {/* FAB: Publicar servicio */}
            <TouchableOpacity
                style={[styles.fab, {
                    backgroundColor: tc.primary,
                    ...(Platform.OS === 'web' ? { boxShadow: '0px 6px 20px rgba(255,107,53,0.4)' } : {}),
                }]}
                onPress={handlePublishService}
                activeOpacity={0.85}
            >
                <Plus size={22} color="#fff" strokeWidth={3} />
                {isDesktop && <Text style={styles.fabText}>Publicar servicio</Text>}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centeredHeader: { width: '100%', maxWidth: 600, alignSelf: 'center' },
    content: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingBottom: 80 },
    maxContainer: { width: '100%', maxWidth: 600 },
    bannerContainer: { marginBottom: 8 },
    fab: {
        position: 'absolute', bottom: 24, right: 24, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8,
        paddingHorizontal: 20, zIndex: 50,
    },
    fabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
