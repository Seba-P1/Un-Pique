import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Store, Clock, AlertTriangle, XCircle } from 'lucide-react-native';
import colors from '../../constants/colors';

interface Metrics {
    active: number;
    trial: number;
    trialEndingSoon: number;
    inactive: number;
}

interface AdminBusiness {
    id: string;
    name: string;
    is_active: boolean;
    subscription_status: 'trial' | 'active' | 'inactive' | 'cancelled' | 'pending_payment';
    subscription_plan: string;
    trial_ends_at: string | null;
    subscription_end_date: string | null;
    commission_rate: number;
}

export default function AdminDashboardScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    
    const [metrics, setMetrics] = useState<Metrics>({ active: 0, trial: 0, trialEndingSoon: 0, inactive: 0 });
    const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Protección de ruta
    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) {
            router.replace('/');
        }
    }, [profile, router]);

    const fetchData = useCallback(async () => {
        try {
            // Métricas (Counts independentes)
            const countActive = supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true);
            const countTrial = supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial');
            
            const now = new Date().toISOString();
            const in7Days = new Date(Date.now() + 7 * 86400000).toISOString();
            const countEndingSoon = supabase.from('businesses').select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'trial')
                .gte('trial_ends_at', now)
                .lte('trial_ends_at', in7Days);
                
            const countInactive = supabase.from('businesses').select('*', { count: 'exact', head: true })
                .in('subscription_status', ['inactive', 'cancelled']);

            // Lista de negocios
            const fetchList = supabase.from('businesses')
                .select('id, name, is_active, subscription_status, subscription_plan, trial_ends_at, subscription_end_date, commission_rate')
                .order('trial_ends_at', { ascending: true, nullsFirst: false });

            const [resActive, resTrial, resEnding, resInactive, resList] = await Promise.all([
                countActive, countTrial, countEndingSoon, countInactive, fetchList
            ]);

            setMetrics({
                active: resActive.count || 0,
                trial: resTrial.count || 0,
                trialEndingSoon: resEnding.count || 0,
                inactive: resInactive.count || 0,
            });

            if (resList.data) {
                setBusinesses(resList.data as AdminBusiness[]);
            }

        } catch (error) {
            console.error('Error fetching admin data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del administrador.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleToggleActive = async (id: string, currentValue: boolean) => {
        const newValue = !currentValue;
        
        // Optimistic update
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, is_active: newValue } : b));
        
        const { error } = await supabase
            .from('businesses')
            .update({ is_active: newValue })
            .eq('id', id);
            
        if (error) {
            // Revert
            setBusinesses(prev => prev.map(b => b.id === id ? { ...b, is_active: currentValue } : b));
            Alert.alert('Error', 'No se pudo actualizar el estado del negocio.');
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(d);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'trial': return { bg: 'rgba(255,107,53,0.15)', text: '#FF6B35' };
            case 'active': return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
            case 'pending_payment': return { bg: 'rgba(234,179,8,0.15)', text: '#eab308' };
            case 'inactive':
            case 'cancelled':
            default: return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Administración" subtitle="PANEL ADMIN" leftIcon="menu" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Administración" subtitle="PANEL ADMIN" leftIcon="menu" />
            
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* SECCIÓN 1 — Grid 2x2 de métricas */}
                <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.metricHeader}>
                            <Store size={20} color={tc.textSecondary} />
                            <Text style={[styles.metricCount, { color: tc.text }]}>{metrics.active}</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: tc.textMuted }]}>Negocios Activos</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.3)' }]}>
                        <View style={styles.metricHeader}>
                            <Clock size={20} color="#FF6B35" />
                            <Text style={[styles.metricCount, { color: '#FF6B35' }]}>{metrics.trial}</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: '#FF6B35' }]}>En Período de Prueba</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: metrics.trialEndingSoon > 0 ? 'rgba(239,68,68,0.08)' : tc.bgCard, borderColor: metrics.trialEndingSoon > 0 ? 'rgba(239,68,68,0.3)' : tc.borderLight }]}>
                        <View style={styles.metricHeader}>
                            <AlertTriangle size={20} color={metrics.trialEndingSoon > 0 ? '#ef4444' : tc.textSecondary} />
                            <Text style={[styles.metricCount, { color: metrics.trialEndingSoon > 0 ? '#ef4444' : tc.text }]}>{metrics.trialEndingSoon}</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: metrics.trialEndingSoon > 0 ? '#ef4444' : tc.textMuted }]}>Trial Vence en 7 Días</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.metricHeader}>
                            <XCircle size={20} color={tc.textSecondary} />
                            <Text style={[styles.metricCount, { color: tc.text }]}>{metrics.inactive}</Text>
                        </View>
                        <Text style={[styles.metricLabel, { color: tc.textMuted }]}>Inactivos / Cancelados</Text>
                    </View>
                </View>

                {/* SECCIÓN 3 — Botón Actualizar (Inline above list) */}
                <View style={styles.listHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Listado de Negocios</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <RefreshCw size={16} color={tc.textSecondary} />
                        <Text style={[styles.refreshText, { color: tc.textSecondary }]}>Actualizar</Text>
                    </TouchableOpacity>
                </View>

                {/* SECCIÓN 2 — Lista de negocios */}
                <View style={styles.listContainer}>
                    {businesses.map((business) => {
                        const statusStyle = getStatusStyle(business.subscription_status);
                        
                        let dateText = '';
                        if (business.subscription_status === 'trial') {
                            dateText = `Trial vence: ${formatDate(business.trial_ends_at)}`;
                        } else if (business.subscription_status === 'active') {
                            dateText = `Vence: ${formatDate(business.subscription_end_date)}`;
                        } else {
                            dateText = 'Inactivo';
                        }

                        return (
                            <View key={business.id} style={[styles.businessCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <View style={styles.businessInfo}>
                                    <Text style={[styles.businessName, { color: tc.text }]}>{business.name}</Text>
                                    
                                    <View style={styles.badgesRow}>
                                        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                                                {business.subscription_status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.dateText, { color: tc.textSecondary }]}>
                                            {dateText}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.businessActions}>
                                    <Text style={[styles.activeLabel, { color: tc.textMuted }]}>
                                        {business.is_active ? 'Visible' : 'Oculto'}
                                    </Text>
                                    <Switch
                                        value={business.is_active}
                                        onValueChange={() => handleToggleActive(business.id, business.is_active)}
                                        trackColor={{ false: tc.borderLight, true: colors.primary.DEFAULT }}
                                        thumbColor="#fff"
                                        ios_backgroundColor={tc.borderLight}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 80,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    metricCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    metricCount: {
        fontSize: 28,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    metricLabel: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    refreshText: {
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    listContainer: {
        gap: 12,
    },
    businessCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    businessInfo: {
        flex: 1,
        paddingRight: 16,
    },
    businessName: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 8,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'Nunito Sans',
    },
    businessActions: {
        alignItems: 'center',
        gap: 4,
    },
    activeLabel: {
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
});
