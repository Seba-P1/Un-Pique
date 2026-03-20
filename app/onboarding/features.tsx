import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles, Wrench, MessageCircle } from 'lucide-react-native';
import { Button } from '../../components/ui';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function OnboardingFeatures() {
    const tc = useThemeColors();

    const features = [
        { id: 1, icon: Sparkles, title: 'Pedí Delivery', description: 'Restaurantes, kioscos y más. Todo a un toque.', color: colors.primary.DEFAULT },
        { id: 2, icon: Wrench, title: 'Buscá Servicios', description: 'Plomeros, electricistas, mecánicos. Todos en tu barrio.', color: colors.secondary.DEFAULT },
        { id: 3, icon: MessageCircle, title: 'Conectá con tu Comunidad', description: 'Compartí experiencias, recomendá locales, hacé amigos.', color: colors.success },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/onboarding/location')}>
                    <Text style={[styles.skipText, { color: tc.textMuted }]}>Omitir</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.featuresContainer}>
                    {features.map((feature) => (
                        <View key={feature.id} style={[styles.featureCard, {
                            backgroundColor: tc.bgCard,
                            borderColor: tc.borderLight,
                            ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
                        }]}>
                            <View style={[styles.iconContainer, { backgroundColor: feature.color + '15' }]}>
                                <feature.icon size={32} color={feature.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.featureTitle, { color: tc.text }]}>{feature.title}</Text>
                                <Text style={[styles.featureDescription, { color: tc.textSecondary }]}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.pagination}>
                    <View style={[styles.dot, { backgroundColor: tc.borderLight }]} />
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={[styles.dot, { backgroundColor: tc.borderLight }]} />
                </View>

                <View style={styles.footer}>
                    <Button title="Anterior" variant="ghost" onPress={() => router.back()} style={styles.backButton} textStyle={{ color: tc.textSecondary }} />
                    <Button title="Siguiente" variant="primary" onPress={() => router.push('/onboarding/location')} style={styles.nextButton} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'flex-end' },
    skipText: { fontFamily: 'Nunito Sans', fontSize: 14, fontWeight: '500' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    featuresContainer: { flex: 1, justifyContent: 'center', gap: 16 },
    featureCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1, gap: 16 },
    iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1 },
    featureTitle: { fontFamily: 'Nunito Sans', fontSize: 18, fontWeight: '600', marginBottom: 4 },
    featureDescription: { fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 20 },
    pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    activeDot: { width: 24, backgroundColor: colors.primary.DEFAULT },
    footer: { flexDirection: 'row', marginBottom: 16, gap: 16 },
    backButton: { flex: 1 },
    nextButton: { flex: 1, height: 56, borderRadius: 16 },
});
