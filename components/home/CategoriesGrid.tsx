// Categorías "¿Qué necesitas hoy?" — Tarjetas premium, cada una lleva a su categoría real
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
    UtensilsCrossed, Briefcase, Home, Users, ShoppingBag, Scissors,
    Bike, Stethoscope, GraduationCap, Wrench
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';

const renderIcon = (Icon: any, size: number, color: string) => <Icon size={size} color={color} />;

interface Category {
    id: string;
    name: string;
    description: string;
    icon: any;
    route: string | null; // null = no existe aún
    gradient: string;
    image: string;
}

const CATEGORIES: Category[] = [
    {
        id: '1', name: 'Delivery', description: 'Comida a tu puerta',
        icon: UtensilsCrossed, route: '/(tabs)/marketplace',
        gradient: '#FF6B35',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop',
    },
    {
        id: '2', name: 'Servicios', description: 'Profesionales cerca',
        icon: Briefcase, route: '/(tabs)/servicios',
        gradient: '#3B82F6',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
    },
    {
        id: '3', name: 'Alojamiento', description: 'Hoteles y cabañas',
        icon: Home, route: '/alojamiento',
        gradient: '#8B5CF6',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
    },
    {
        id: '4', name: 'Directorio', description: 'Negocios locales',
        icon: Users, route: null,
        gradient: '#10B981',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
    },
    {
        id: '5', name: 'Tiendas', description: 'Compras y productos',
        icon: ShoppingBag, route: null,
        gradient: '#F59E0B',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
    },
    {
        id: '6', name: 'Belleza', description: 'Peluquerías y spa',
        icon: Scissors, route: null,
        gradient: '#EC4899',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop',
    },
    {
        id: '7', name: 'Envíos', description: 'Mensajería rápida',
        icon: Bike, route: null,
        gradient: '#06B6D4',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&h=200&fit=crop',
    },
    {
        id: '8', name: 'Salud', description: 'Farmacias y más',
        icon: Stethoscope, route: null,
        gradient: '#EF4444',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop',
    },
    {
        id: '9', name: 'Educación', description: 'Clases y cursos',
        icon: GraduationCap, route: null,
        gradient: '#6366F1',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=200&fit=crop',
    },
    {
        id: '10', name: 'Reparaciones', description: 'Técnicos a domicilio',
        icon: Wrench, route: null,
        gradient: '#78716C',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop',
    },
];

export const CategoriesGrid = () => {
    const tc = useThemeColors();
    const router = useRouter();

    const handlePress = (cat: Category) => {
        if (cat.route) {
            router.push(cat.route as any);
        } else {
            showAlert(cat.name, `No hay resultados en "${cat.name}" por el momento. ¡Pronto agregaremos opciones!`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, { color: tc.text }]}>¿Qué necesitas hoy?</Text>
                <TouchableOpacity onPress={() => showAlert('Categorías', 'Pronto podrás explorar todas las categorías disponibles.')}>
                    <Text style={[styles.seeAll, { color: tc.primary }]}>Ver todo</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CATEGORIES.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.card, { backgroundColor: tc.bgCard }]}
                        onPress={() => handlePress(item)}
                        activeOpacity={0.8}
                    >
                        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                        <View style={[styles.cardOverlay, { backgroundColor: item.gradient + 'CC' }]}>
                            <View style={styles.iconBadge}>
                                {renderIcon(item.icon, 20, '#fff')}
                            </View>
                            <Text style={styles.cardName}>{item.name}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 16, gap: 14 },
    card: {
        width: 140,
        height: 160,
        borderRadius: 20,
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 24px rgba(0,0,0,0.1)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 }),
    },
    cardImage: { width: '100%', height: '100%', position: 'absolute' },
    cardOverlay: { flex: 1, justifyContent: 'flex-end', padding: 12 },
    iconBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
    cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500', marginTop: 3 },
});
