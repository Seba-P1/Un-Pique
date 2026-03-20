import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { HeaderTypeB } from '../components/ui';

export default function SearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const tc = useThemeColors();
    const initialQuery = params.q as string || '';

    // Mock results for now - in real app connect to Supabase/Algolia
    const [results, setResults] = useState<any[]>([]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <HeaderTypeB title="Búsqueda" />

            <View style={styles.content}>
                <Text style={[styles.queryText, { color: tc.textSecondary }]}>
                    Resultados para: <Text style={{ fontWeight: 'bold', color: tc.text }}>{initialQuery}</Text>
                </Text>

                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: tc.textMuted }]}>
                        Funcionalidad de búsqueda en construcción.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    queryText: { fontSize: 16, marginBottom: 20 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { fontStyle: 'italic' }
});
