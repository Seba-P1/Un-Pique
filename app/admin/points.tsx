import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { usePricingStore } from '../../stores/pricingStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { Award, TrendingUp } from 'lucide-react-native';
import colors from '../../constants/colors';

export default function AdminPointsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    const { config, fetchPricing, getPointValue } = usePricingStore();
    const [localValue, setLocalValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    useEffect(() => {
        if (!config) {
            fetchPricing();
        }
    }, []);

    useEffect(() => {
        if (config) {
            setLocalValue(config.loyalty_point_value_ars.toString());
        }
    }, [config]);

    const currentValue = parseFloat(localValue) || 0;
    const hasChanges = config ? localValue !== config.loyalty_point_value_ars.toString() : false;

    const handleSave = async () => {
        if (!hasChanges || currentValue <= 0) return;
        setSaving(true);
        try {
            // Try update first
            const { data, error: updateError } = await supabase
                .from('pricing_config')
                .update({ value: localValue })
                .eq('key', 'loyalty_point_value_ars')
                .select();

            // If no rows updated, insert
            if (!updateError && (!data || data.length === 0)) {
                await supabase.from('pricing_config').insert({ key: 'loyalty_point_value_ars', value: localValue });
            }

            await fetchPricing();
            Alert.alert('✅ Guardado', `1 punto ahora equivale a $${currentValue}`);
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar el valor de los puntos.');
        } finally {
            setSaving(false);
        }
    };

    const previews = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Club Un Pique" subtitle="VALOR DE PUNTOS" leftIcon="back" />

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header Card */}
                <View style={[styles.headerCard, { backgroundColor: tc.bgCard, borderColor: '#FF6B35' }]}>
                    <View style={styles.headerIcon}>
                        <Award size={32} color="#FF6B35" />
                    </View>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Valor del Punto</Text>
                    <Text style={[styles.headerSubtitle, { color: tc.textSecondary }]}>
                        Definí cuánto vale cada punto del Club Un Pique en pesos argentinos. 
                        Este valor se usa para calcular el equivalente monetario de las recompensas.
                    </Text>
                </View>

                {/* Input Section */}
                <View style={[styles.inputCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.inputLabel, { color: tc.textSecondary }]}>1 punto equivale a:</Text>
                    <View style={[styles.inputRow, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                        <Text style={[styles.currencySign, { color: tc.textMuted }]}>$</Text>
                        <TextInput
                            style={[styles.input, { color: tc.text }]}
                            value={localValue}
                            onChangeText={t => setLocalValue(t.replace(/[^0-9.]/g, ''))}
                            keyboardType="numeric"
                            placeholder="10"
                            placeholderTextColor={tc.textMuted}
                        />
                        <Text style={[styles.arsLabel, { color: tc.textMuted }]}>ARS</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, !hasChanges && { opacity: 0.5 }]}
                        onPress={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
                    </TouchableOpacity>
                </View>

                {/* Preview Table */}
                <View style={[styles.previewCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <View style={styles.previewHeader}>
                        <TrendingUp size={18} color="#FF6B35" />
                        <Text style={[styles.previewTitle, { color: tc.text }]}>Vista Previa</Text>
                    </View>

                    <View style={[styles.tableHeader, { borderBottomColor: tc.borderLight }]}>
                        <Text style={[styles.colHeader, { color: tc.textMuted }]}>Puntos</Text>
                        <Text style={[styles.colHeader, styles.colRight, { color: tc.textMuted }]}>Equivalente</Text>
                    </View>

                    {previews.map((pts) => (
                        <View key={pts} style={[styles.tableRow, { borderBottomColor: tc.borderLight }]}>
                            <View style={styles.ptsCell}>
                                <Text style={[styles.ptsValue, { color: tc.text }]}>{pts.toLocaleString('es-AR')}</Text>
                                <Text style={[styles.ptsLabel, { color: tc.textMuted }]}> pts</Text>
                            </View>
                            <Text style={[styles.equivValue, { color: '#FF6B35' }]}>
                                ${(pts * currentValue).toLocaleString('es-AR')}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 80, maxWidth: 600, width: '100%', alignSelf: 'center' },
    headerCard: {
        borderWidth: 1, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center',
    },
    headerIcon: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.12)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 8 },
    headerSubtitle: { fontSize: 14, fontFamily: 'Nunito Sans', lineHeight: 22, textAlign: 'center' },
    inputCard: {
        borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20,
    },
    inputLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans', marginBottom: 12 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10,
        paddingHorizontal: 16, height: 52, marginBottom: 16,
    },
    currencySign: { fontSize: 20, fontWeight: '700', marginRight: 4 },
    input: {
        flex: 1, fontSize: 24, fontWeight: '800', fontFamily: 'Nunito Sans',
        ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any,
    },
    arsLabel: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
    saveBtn: {
        backgroundColor: '#FF6B35', height: 44, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    previewCard: {
        borderWidth: 1, borderRadius: 16, padding: 20,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    previewTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, marginBottom: 4 },
    colHeader: { fontSize: 11, fontWeight: '700', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: 0.5 },
    colRight: { textAlign: 'right' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    ptsCell: { flexDirection: 'row', alignItems: 'baseline' },
    ptsValue: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans' },
    ptsLabel: { fontSize: 12, fontFamily: 'Nunito Sans' },
    equivValue: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
});
