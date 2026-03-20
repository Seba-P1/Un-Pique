// Onboarding Screen - Dark Mode Premium
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Check } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1', title: 'Descubrí todo\ntu barrio',
        description: 'Explorá los mejores comercios, servicios y novedades de tu localidad en un solo lugar.',
        image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&q=80',
    },
    {
        id: '2', title: 'Pedí delivery\nen minutos',
        description: 'Tus comidas favoritas de Sabor Local directas a tu puerta con seguimiento en tiempo real.',
        image: 'https://images.unsplash.com/photo-1513639776629-9269d0d3886f?w=800&q=80',
    },
    {
        id: '3', title: 'Conectá con\ntu comunidad',
        description: 'Interactuá con vecinos, compartí momentos y encontrá lo que necesitás.',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/role-selection');
        } catch (error) {
            console.error('Error saving onboarding status', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, { color: tc.text }]}>{item.title}</Text>
                            <Text style={[styles.description, { color: tc.textSecondary }]}>{item.description}</Text>
                        </View>
                    </View>
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                keyExtractor={(item) => item.id}
                bounces={false}
            />

            {/* Dots */}
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => (
                    <View key={index} style={[
                        styles.dot,
                        currentIndex === index
                            ? styles.activeDot
                            : [styles.inactiveDot, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.2)' : colors.gray[300] }],
                    ]} />
                ))}
            </View>

            {/* Actions */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: tc.textMuted }]}>Saltar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>
                        {currentIndex === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}
                    </Text>
                    {currentIndex === SLIDES.length - 1
                        ? <Check size={20} color="#fff" />
                        : <ArrowRight size={20} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: { width, height: '100%' },
    image: { width: '100%', height: '60%', borderBottomRightRadius: 32, borderBottomLeftRadius: 32 },
    textContainer: { flex: 1, padding: 32, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '900', marginBottom: 16, lineHeight: 38, letterSpacing: -0.5 },
    description: { fontSize: 16, lineHeight: 24 },
    pagination: { flexDirection: 'row', position: 'absolute', bottom: 140, left: 32 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activeDot: { backgroundColor: colors.primary.DEFAULT, width: 24 },
    inactiveDot: {},
    footer: { position: 'absolute', bottom: 50, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    skipButton: { padding: 10 },
    skipText: { fontSize: 16, fontWeight: '600' },
    nextButton: {
        backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
        boxShadow: '0px 4px 16px rgba(255,107,53,0.35)',
    },
    nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
