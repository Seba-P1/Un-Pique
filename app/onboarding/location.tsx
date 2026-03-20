import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, MapPin, ChevronRight } from 'lucide-react-native';
import { Button } from '../../components/ui';
import colors from '../../constants/colors';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function OnboardingLocation() {
    const tc = useThemeColors();
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { availableLocalities, setCurrentLocality } = useLocationStore();
    const { user, completeOnboarding } = useAuthStore();

    const filteredLocalities = availableLocalities.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.province.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (locality: any) => { setSelectedId(locality.id); };

    const handleContinue = async () => {
        if (!selectedId) return;
        const locality = availableLocalities.find(l => l.id === selectedId);
        if (locality) {
            setCurrentLocality(locality);
            if (user) { await completeOnboarding(); router.replace('/(tabs)'); }
            else { router.replace('/(auth)/login'); }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Elegí tu localidad</Text>
                <Text style={[styles.subtitle, { color: tc.textMuted }]}>Seleccioná dónde querés usar Un Pique</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                <Search size={20} color={tc.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: tc.text }]}
                    placeholder="Buscar localidad..."
                    placeholderTextColor={tc.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {filteredLocalities.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.item, { borderBottomColor: tc.borderLight }, selectedId === item.id && styles.itemSelected]}
                        onPress={() => handleSelect(item)}
                    >
                        <View style={styles.itemIcon}>
                            <MapPin size={20} color={selectedId === item.id ? colors.primary.DEFAULT : tc.textMuted} />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, { color: tc.text }, selectedId === item.id && styles.itemNameSelected]}>{item.name}</Text>
                            <Text style={[styles.itemProvince, { color: tc.textMuted }]}>{item.province}, Argentina</Text>
                        </View>
                        <ChevronRight size={20} color={tc.textMuted} />
                    </TouchableOpacity>
                ))}
                {filteredLocalities.length === 0 && (
                    <Text style={[styles.emptyText, { color: tc.textMuted }]}>No se encontraron localidades</Text>
                )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                <Button title="Continuar" variant="primary" onPress={handleContinue} disabled={!selectedId} style={styles.button} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
    title: { fontFamily: 'Nunito Sans', fontSize: 28, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontFamily: 'Nunito Sans', fontSize: 14 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, paddingHorizontal: 16, height: 48, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontFamily: 'Nunito Sans', fontSize: 16 },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 24, paddingBottom: 24 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    itemSelected: { backgroundColor: colors.primary.DEFAULT + '10', borderRadius: 12, paddingHorizontal: 12, borderBottomWidth: 0 },
    itemIcon: { marginRight: 16 },
    itemInfo: { flex: 1 },
    itemName: { fontFamily: 'Nunito Sans', fontSize: 16, fontWeight: '500', marginBottom: 2 },
    itemNameSelected: { color: colors.primary.DEFAULT, fontWeight: '600' },
    itemProvince: { fontFamily: 'Nunito Sans', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 32, fontFamily: 'Nunito Sans' },
    footer: { padding: 24, borderTopWidth: 1 },
    button: { height: 56, borderRadius: 12 },
});
