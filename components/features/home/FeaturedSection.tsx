import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const FEATURED = [
    { id: '1', name: 'Burger King', rating: 4.8, image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80', category: 'Hamburguesas' },
    { id: '2', name: 'La Pasiva', rating: 4.5, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80', category: 'Chivitos' },
    { id: '3', name: 'Sushi Go', rating: 4.9, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80', category: 'Japonesa' },
];

export const FeaturedSection = () => {
    const tc = useThemeColors();
    const router = useRouter();

    const handlePress = (item: typeof FEATURED[0]) => {
        // Navigate to the marketplace/restaurant detail page
        router.push(`/shop/${item.id}` as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Destacados ⭐</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace' as any)}>
                    <Text style={[styles.seeAll, { color: tc.primary }]}>Ver todos</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                data={FEATURED}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: tc.bgCard }]}
                        activeOpacity={0.8}
                        onPress={() => handlePress(item)}
                    >
                        <Image source={{ uri: item.image }} style={[styles.image, { backgroundColor: tc.bgInput }]} />
                        <View style={styles.info}>
                            <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.row}>
                                <Star size={14} color={colors.warning} fill={colors.warning} />
                                <Text style={[styles.rating, { color: tc.text }]}>{item.rating}</Text>
                                <Text style={[styles.dot, { color: tc.textMuted }]}>•</Text>
                                <Text style={[styles.category, { color: tc.textSecondary }]}>{item.category}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    listContent: { paddingHorizontal: 16 },
    card: {
        width: 200, marginRight: 16, borderRadius: 16, padding: 8,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */    
    },
    image: { width: '100%', height: 120, borderRadius: 12, marginBottom: 8 },
    info: { paddingHorizontal: 4, paddingBottom: 4 },
    name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rating: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
    dot: { marginHorizontal: 6 },
    category: { fontSize: 12 },
});
