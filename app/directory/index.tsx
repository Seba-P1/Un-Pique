import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, MapPin, Star, ChevronRight, Briefcase, Wrench, Bike } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Briefcase },
    { id: 'plumbing', label: 'Plomería', icon: Wrench },
    { id: 'mechanic', label: 'Mecánica', icon: Bike },
    { id: 'health', label: 'Salud', icon: Briefcase },
];

const MOCK_SERVICES = [
    { id: 'SERV-001', name: 'Plomería García', category: 'plumbing', rating: 4.8, reviews: 24, address: 'Calle 12, Nro 450', phone: '291-1234567', avatar: 'https://images.unsplash.com/photo-1581578731117-104529302f28?q=80&w=100', description: 'Reparaciones urgentes, instalaciones y mantenimiento general.' },
    { id: 'SERV-002', name: 'Taller Mecánico El Tuerca', category: 'mechanic', rating: 4.5, reviews: 56, address: 'Av. Libertador 2200', phone: '291-9876543', avatar: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=100', description: 'Mecánica ligera, frenos, cambio de aceite y filtros.' },
    { id: 'SERV-003', name: 'Dra. Ana Martinez', category: 'health', rating: 5.0, reviews: 12, address: 'Consultorios Centro, Piso 2', phone: '291-4567890', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=100', description: 'Pediatría y medicina familiar.' },
];

export default function DirectoryScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { category } = useLocalSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(category || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = MOCK_SERVICES.filter(service => {
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, {
                backgroundColor: tc.bgCard,
                ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
            }]}
            activeOpacity={0.9}
            onPress={() => router.push(`/directory/${item.id}`)}
        >
            <Image source={{ uri: item.avatar }} style={[styles.avatar, { backgroundColor: tc.bgInput }]} />
            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={[styles.name, { color: tc.text }]}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Star size={12} color={colors.white} fill={colors.white} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>
                <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                <View style={styles.footerRow}>
                    <View style={styles.location}>
                        <MapPin size={14} color={tc.textMuted} />
                        <Text style={[styles.locationText, { color: tc.textMuted }]}>{item.address}</Text>
                    </View>
                </View>
            </View>
            <ChevronRight size={20} color={tc.textMuted} style={{ alignSelf: 'center' }} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={[styles.searchContainer, { backgroundColor: tc.bgCard }]}>
                <View style={[styles.searchBar, { backgroundColor: tc.bgInput }]}>
                    <Search size={20} color={tc.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: tc.text }]}
                        placeholder="Buscar servicios..."
                        placeholderTextColor={tc.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={[styles.categoriesContainer, { backgroundColor: tc.bgCard }]}>
                <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.categoryChip, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }, selectedCategory === item.id && styles.activeChip]}
                            onPress={() => setSelectedCategory(item.id)}
                        >
                            <Text style={[styles.categoryText, { color: tc.textSecondary }, selectedCategory === item.id && styles.activeCategoryText]}>{item.label}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                data={filteredServices}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: tc.textMuted }]}>No se encontraron servicios.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { padding: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: 12 },
    searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Nunito Sans', fontSize: 16 },
    categoriesContainer: { paddingVertical: 12, marginBottom: 8 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    activeChip: { backgroundColor: colors.primary.DEFAULT, borderColor: colors.primary.DEFAULT },
    categoryText: { fontFamily: 'Nunito Sans', fontSize: 14, fontWeight: '500' },
    activeCategoryText: { color: colors.white },
    listContent: { padding: 16 },
    card: { flexDirection: 'row', padding: 12, borderRadius: 16, marginBottom: 12 },
    avatar: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
    info: { flex: 1, marginRight: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontFamily: 'Nunito Sans', fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
    ratingText: { fontFamily: 'Nunito Sans', fontSize: 11, fontWeight: '700', color: colors.white },
    description: { fontFamily: 'Nunito Sans', fontSize: 13, marginBottom: 8, lineHeight: 18 },
    footerRow: { flexDirection: 'row', alignItems: 'center' },
    location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontFamily: 'Nunito Sans', fontSize: 12 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { fontFamily: 'Nunito Sans' },
});
