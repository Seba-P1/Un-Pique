import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { Play, Pause, XCircle, Eye, MousePointer, Megaphone } from 'lucide-react-native';
import colors from '../../constants/colors';

interface AdminAd {
    id: string;
    business_id: string;
    business_name: string;
    plan_type: 'daily' | 'weekly' | 'monthly';
    price: number;
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    started_at: string | null;
    expires_at: string | null;
    impressions: number;
    clicks: number;
    created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
    daily: 'Diaria',
    weekly: 'Semanal',
    monthly: 'Mensual',
};

export default function AdminAdsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    const [ads, setAds] = useState<AdminAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    const fetchAds = useCallback(async () => {
        try {
            let query = supabase
                .from('advertisements')
                .select(`*, businesses(name)`)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mapped: AdminAd[] = (data || []).map((a: any) => {
                const biz = Array.isArray(a.businesses) ? a.businesses[0] : a.businesses;
                return {
                    ...a,
                    business_name: biz?.name || 'N/A',
                };
            });
            setAds(mapped);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchAds();
    }, [fetchAds]);

    const onRefresh = () => { setRefreshing(true); fetchAds(); };

    const handleActivate = async (ad: AdminAd) => {
        setProcessingId(ad.id);
        try {
            const duration = ad.plan_type === 'daily' ? 1 : ad.plan_type === 'weekly' ? 7 : 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);

            await supabase.from('advertisements').update({
                status: 'active',
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
            }).eq('id', ad.id);

            setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'active', started_at: new Date().toISOString(), expires_at: expiresAt.toISOString() } : a));
            Alert.alert('✅ Activada', `Publicidad de ${ad.business_name} activada por ${duration} días.`);
        } catch (e) {
            Alert.alert('Error', 'No se pudo activar la publicidad.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (ad: AdminAd) => {
        Alert.alert('Cancelar Publicidad', `¿Cancelar la publicidad de "${ad.business_name}"?`, [
            { text: 'No', style: 'cancel' },
            {
                text: 'Sí, cancelar', style: 'destructive',
                onPress: async () => {
                    setProcessingId(ad.id);
                    try {
                        await supabase.from('advertisements').update({ status: 'cancelled' }).eq('id', ad.id);
                        setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'cancelled' } : a));
                    } catch (e) {
                        Alert.alert('Error', 'No se pudo cancelar.');
                    } finally {
                        setProcessingId(null);
                    }
                }
            }
        ]);
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' };
            case 'pending': return { bg: 'rgba(234,179,8,0.15)', color: '#eab308' };
            case 'expired': return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' };
            case 'cancelled': return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
            default: return { bg: 'rgba(0,0,0,0.05)', color: '#666' };
        }
    };

    const filters = [
        { key: 'all', label: 'Todos' },
        { key: 'pending', label: 'Pendientes' },
        { key: 'active', label: 'Activas' },
        { key: 'expired', label: 'Expiradas' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Publicidad" subtitle="ADMIN" leftIcon="back" />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Publicidad" subtitle="ADMIN" leftIcon="back" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterTab, filter === f.key && { backgroundColor: '#FF6B35' }]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Metrics summary */}
                <View style={styles.metricsRow}>
                    <View style={[styles.miniMetric, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.miniMetricValue, { color: '#22c55e' }]}>{ads.filter(a => a.status === 'active').length}</Text>
                        <Text style={[styles.miniMetricLabel, { color: tc.textMuted }]}>Activas</Text>
                    </View>
                    <View style={[styles.miniMetric, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.miniMetricValue, { color: '#eab308' }]}>{ads.filter(a => a.status === 'pending').length}</Text>
                        <Text style={[styles.miniMetricLabel, { color: tc.textMuted }]}>Pendientes</Text>
                    </View>
                    <View style={[styles.miniMetric, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.miniMetricValue, { color: tc.text }]}>
                            ${ads.reduce((s, a) => s + (a.status === 'active' || a.status === 'expired' ? a.price : 0), 0).toLocaleString('es-AR')}
                        </Text>
                        <Text style={[styles.miniMetricLabel, { color: tc.textMuted }]}>Ingresos</Text>
                    </View>
                </View>

                {ads.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Megaphone size={40} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No hay publicidades en este filtro</Text>
                    </View>
                ) : (
                    <View style={styles.adsList}>
                        {ads.map((ad) => {
                            const st = getStatusStyle(ad.status);
                            return (
                                <View key={ad.id} style={[styles.adCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <View style={styles.adHeader}>
                                        <Text style={[styles.adBizName, { color: tc.text }]} numberOfLines={1}>{ad.business_name}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: st.color }}>{ad.status.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.adDetails}>
                                        <View style={styles.adDetailItem}>
                                            <Text style={[styles.adDetailLabel, { color: tc.textMuted }]}>Plan</Text>
                                            <Text style={[styles.adDetailValue, { color: tc.text }]}>{PLAN_LABELS[ad.plan_type] || ad.plan_type}</Text>
                                        </View>
                                        <View style={styles.adDetailItem}>
                                            <Text style={[styles.adDetailLabel, { color: tc.textMuted }]}>Precio</Text>
                                            <Text style={[styles.adDetailValue, { color: tc.text }]}>${ad.price.toLocaleString('es-AR')}</Text>
                                        </View>
                                        <View style={styles.adDetailItem}>
                                            <Text style={[styles.adDetailLabel, { color: tc.textMuted }]}>Inicio</Text>
                                            <Text style={[styles.adDetailValue, { color: tc.text }]}>{formatDate(ad.started_at)}</Text>
                                        </View>
                                        <View style={styles.adDetailItem}>
                                            <Text style={[styles.adDetailLabel, { color: tc.textMuted }]}>Vence</Text>
                                            <Text style={[styles.adDetailValue, { color: tc.text }]}>{formatDate(ad.expires_at)}</Text>
                                        </View>
                                    </View>

                                    {/* Performance */}
                                    <View style={[styles.perfRow, { backgroundColor: tc.bg }]}>
                                        <View style={styles.perfItem}>
                                            <Eye size={14} color={tc.textMuted} />
                                            <Text style={[styles.perfValue, { color: tc.text }]}>{ad.impressions}</Text>
                                            <Text style={[styles.perfLabel, { color: tc.textMuted }]}>impresiones</Text>
                                        </View>
                                        <View style={styles.perfItem}>
                                            <MousePointer size={14} color={tc.textMuted} />
                                            <Text style={[styles.perfValue, { color: tc.text }]}>{ad.clicks}</Text>
                                            <Text style={[styles.perfLabel, { color: tc.textMuted }]}>clicks</Text>
                                        </View>
                                        {ad.impressions > 0 && (
                                            <View style={styles.perfItem}>
                                                <Text style={[styles.perfValue, { color: '#FF6B35' }]}>{((ad.clicks / ad.impressions) * 100).toFixed(1)}%</Text>
                                                <Text style={[styles.perfLabel, { color: tc.textMuted }]}>CTR</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Actions */}
                                    {ad.status === 'pending' && (
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleActivate(ad)} disabled={processingId === ad.id}>
                                                {processingId === ad.id ? <ActivityIndicator size="small" color="#FFF" /> : <><Play size={14} color="#FFF" /><Text style={styles.actionBtnText}>Activar</Text></>}
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => handleCancel(ad)}>
                                                <XCircle size={14} color="#ef4444" /><Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Rechazar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {ad.status === 'active' && (
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginTop: 8 }]} onPress={() => handleCancel(ad)}>
                                            <Pause size={14} color="#ef4444" /><Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cancelar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 80, maxWidth: 800, width: '100%', alignSelf: 'center' },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)' },
    filterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#999' },
    metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    miniMetric: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    miniMetricValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Nunito Sans' },
    miniMetricLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans', marginTop: 2 },
    emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 15, fontFamily: 'Nunito Sans', textAlign: 'center' },
    adsList: { gap: 12 },
    adCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
    adHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    adBizName: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    adDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
    adDetailItem: {},
    adDetailLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: 0.5 },
    adDetailValue: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    perfRow: { flexDirection: 'row', gap: 16, padding: 10, borderRadius: 8, marginBottom: 8 },
    perfItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    perfValue: { fontSize: 13, fontWeight: '800', fontFamily: 'Nunito Sans' },
    perfLabel: { fontSize: 11, fontFamily: 'Nunito Sans' },
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    actionBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#FFF' },
});
