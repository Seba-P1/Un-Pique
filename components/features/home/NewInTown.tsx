import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const NEW_PLACES = [
    { id: '1', name: 'Café Central', address: 'Plaza 25 de Mayo', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', isNew: true },
    { id: '2', name: 'Heladería Fri', address: 'Av. Libertador 220', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80', isNew: true },
];

export const NewInTown = () => {
    const tc = useThemeColors();
    const router = useRouter();

    const handlePress = (item: typeof NEW_PLACES[0]) => {
        router.push(`/shop/${item.id}` as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Nuevo en la zona 🎉</Text>
            </View>

            <FlatList
                horizontal
                data={NEW_PLACES}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => handlePress(item)}
                    >
                        <Image source={{ uri: item.image }} style={[styles.image, { backgroundColor: tc.bgInput }]} />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>NUEVO</Text>
                        </View>
                        <View style={styles.overlay}>
                            <Text style={styles.name}>{item.name}</Text>
                            <View style={styles.addressRow}>
                                <MapPin size={12} color={colors.white} />
                                <Text style={styles.address}>{item.address}</Text>
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
    header: { paddingHorizontal: 20, marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700' },
    listContent: { paddingHorizontal: 16 },
    card: { width: 140, height: 180, marginRight: 12, borderRadius: 16, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
    name: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 4 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    address: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
});
