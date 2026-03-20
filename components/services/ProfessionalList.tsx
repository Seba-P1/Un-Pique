import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ProfessionalCard } from './ProfessionalCard';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const MOCK_PROFESSIONALS = [
    {
        id: '1', full_name: 'Juan Pérez', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
        specialty: 'Plomería', rating: 4.8, reviews_count: 124, location: 'Montevideo, Centro',
        hourly_rate: 800, description: 'Especialista en reparaciones domésticas y urgencias 24h.'
    },
    {
        id: '2', full_name: 'María García', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
        specialty: 'Limpieza', rating: 4.9, reviews_count: 89, location: 'Pocitos',
        hourly_rate: 500, description: 'Servicio de limpieza profunda y mantenimiento general.'
    },
    {
        id: '3', full_name: 'Carlos Ruiz', avatar_url: 'https://randomuser.me/api/portraits/men/85.jpg',
        specialty: 'Electricista', rating: 4.7, reviews_count: 56, location: 'Carrasco',
        hourly_rate: 950, description: 'Instalaciones eléctricas residenciales y comerciales.'
    }
];

export function ProfessionalList() {
    const tc = useThemeColors();
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchProfessionals(); }, []);

    const fetchProfessionals = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setProfessionals(MOCK_PROFESSIONALS);
        } catch (error) {
            console.error('Error fetching professionals:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tc.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Recomendados</Text>
            {professionals.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 20 },
    loadingContainer: { padding: 40, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
});
