// ServiceCategories — Tarjetas premium con imagen, muchos más servicios, opción de registrarse
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Wrench, Zap, Droplets, Paintbrush, Hammer, Bike, Scissors, Heart,
    Camera, BookOpen, Baby, Dog, Car, Wifi, Shield, Stethoscope,
    ChefHat, Dumbbell, Music, Leaf
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';

const renderIcon = (Icon: any, size: number, color: string) => <Icon size={size} color={color} />;

interface ServiceCat {
    id: string;
    name: string;
    description: string;
    icon: any;
    gradient: string;
    image: string;
}

const SERVICE_CATEGORIES: ServiceCat[] = [
    { id: '1', name: 'Plomería', description: 'Agua y gas', icon: Droplets, gradient: '#3B82F6', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&h=200&fit=crop' },
    { id: '2', name: 'Electricidad', description: 'Instalaciones', icon: Zap, gradient: '#F59E0B', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop' },
    { id: '3', name: 'Mecánica', description: 'Autos y motos', icon: Wrench, gradient: '#EF4444', image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=300&h=200&fit=crop' },
    { id: '4', name: 'Pintura', description: 'Interior y exterior', icon: Paintbrush, gradient: '#10B981', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=300&h=200&fit=crop' },
    { id: '5', name: 'Albañilería', description: 'Construcción', icon: Hammer, gradient: '#8B5CF6', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop' },
    { id: '6', name: 'Fletes', description: 'Mudanzas', icon: Bike, gradient: '#6366F1', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&h=200&fit=crop' },
    { id: '7', name: 'Peluquería', description: 'Cortes y color', icon: Scissors, gradient: '#EC4899', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop' },
    { id: '8', name: 'Salud', description: 'Médicos y enfermería', icon: Stethoscope, gradient: '#EF4444', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop' },
    { id: '9', name: 'Fotografía', description: 'Eventos y retratos', icon: Camera, gradient: '#F97316', image: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=300&h=200&fit=crop' },
    { id: '10', name: 'Clases', description: 'Tutorías y cursos', icon: BookOpen, gradient: '#3B82F6', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=200&fit=crop' },
    { id: '11', name: 'Niñera', description: 'Cuidado infantil', icon: Baby, gradient: '#F472B6', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=300&h=200&fit=crop' },
    { id: '12', name: 'Mascotas', description: 'Paseo y cuidado', icon: Dog, gradient: '#A78BFA', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop' },
    { id: '13', name: 'Lavadero', description: 'Autos y ropa', icon: Car, gradient: '#06B6D4', image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300&h=200&fit=crop' },
    { id: '14', name: 'Internet/PC', description: 'Soporte técnico', icon: Wifi, gradient: '#14B8A6', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop' },
    { id: '15', name: 'Seguridad', description: 'Cámaras y alarmas', icon: Shield, gradient: '#64748B', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=300&h=200&fit=crop' },
    { id: '16', name: 'Chef a domicilio', description: 'Cocina gourmet', icon: ChefHat, gradient: '#DC2626', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=200&fit=crop' },
    { id: '17', name: 'Personal Trainer', description: 'Fitness', icon: Dumbbell, gradient: '#059669', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop' },
    { id: '18', name: 'Música', description: 'Clases y DJ', icon: Music, gradient: '#7C3AED', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop' },
    { id: '19', name: 'Jardinería', description: 'Mantenimiento', icon: Leaf, gradient: '#22C55E', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop' },
    { id: '20', name: 'Cuidado personal', description: 'Masajes y spa', icon: Heart, gradient: '#E11D48', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop' },
];

export const ServiceCategories = () => {
    const tc = useThemeColors();
    const router = useRouter();

    const handlePress = (cat: ServiceCat) => {
        showAlert(
            cat.name,
            `No hay profesionales de "${cat.name}" registrados en tu zona por el momento.\n\n¿Sos profesional de ${cat.name}? ¡Registrate como socio y empezá a ofrecer tus servicios!`,
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: tc.text }]}>¿Qué necesitás hoy?</Text>
                <TouchableOpacity onPress={() => showAlert('Categorías', 'Pronto podrás explorar todas las categorías de servicios.')}>
                    <Text style={[styles.seeAll, { color: tc.primary }]}>Ver todo</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {SERVICE_CATEGORIES.map((item) => (
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
    container: { paddingVertical: 16, marginBottom: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
    title: { paddingHorizontal: 0, fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 16, gap: 12 },
    card: { width: 140, height: 160, borderRadius: 16, overflow: 'hidden', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */     },
    cardImage: { width: '100%', height: '100%', position: 'absolute' },
    cardOverlay: { flex: 1, justifyContent: 'flex-end', padding: 12 },
    iconBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardName: { color: '#fff', fontSize: 15, fontWeight: '800',    },
    cardDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 },
});
