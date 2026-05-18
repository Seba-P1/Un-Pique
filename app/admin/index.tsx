import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Store, Clock, AlertTriangle, XCircle, Search, Megaphone, Award, ChevronRight, FileText, DollarSign, CreditCard } from 'lucide-react-native';
import colors from '../../constants/colors';
import { usePricingStore } from '../../stores/pricingStore';

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

function differenceInDays(date1: Date, date2: Date) {
    return Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
}

function PricingEditor() {
    const tc = useThemeColors();
    const { config, loading, fetchPricing } = usePricingStore();
    const [local, setLocal] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPricing();
    }, []);

    useEffect(() => {
        if (config) {
            setLocal({
                plan_basic_price_ars: config.plan_basic_price_ars.toString(),
                plan_premium_price_ars: config.plan_premium_price_ars.toString(),
                ad_price_daily: config.ad_price_daily.toString(),
                ad_price_weekly: config.ad_price_weekly.toString(),
                ad_price_monthly: config.ad_price_monthly.toString(),
                trial_commission_rate: (config.trial_commission_rate * 100).toString(),
            });
        }
    }, [config]);

    const hasChanges = () => {
        if (!config || !local) return false;
        return (
            local.plan_basic_price_ars !== config.plan_basic_price_ars.toString() ||
            local.plan_premium_price_ars !== config.plan_premium_price_ars.toString() ||
            local.ad_price_daily !== config.ad_price_daily.toString() ||
            local.ad_price_weekly !== config.ad_price_weekly.toString() ||
            local.ad_price_monthly !== config.ad_price_monthly.toString() ||
            local.trial_commission_rate !== (config.trial_commission_rate * 100).toString()
        );
    };

    const handleSave = async () => {
        if (!hasChanges()) return;
        setSaving(true);
        try {
            const updates = [
                { key: 'plan_basic_price_ars', value: local.plan_basic_price_ars },
                { key: 'plan_premium_price_ars', value: local.plan_premium_price_ars },
                { key: 'ad_price_daily', value: local.ad_price_daily },
                { key: 'ad_price_weekly', value: local.ad_price_weekly },
                { key: 'ad_price_monthly', value: local.ad_price_monthly },
                { key: 'trial_commission_rate', value: (parseFloat(local.trial_commission_rate) / 100).toString() },
            ];

            for (const item of updates) {
                await supabase.from('pricing_config').update({ value: item.value }).eq('key', item.key);
            }
            
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('pricing_config').update({ value: today }).eq('key', 'pricing_last_updated');
            
            await fetchPricing();
            Alert.alert("Éxito", "Precios actualizados correctamente");
        } catch (e) {
            Alert.alert("Error", "No se pudieron actualizar los precios");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !config || !local) {
        return (
            <View style={[styles.pricingCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: tc.text, marginBottom: 16 }]}>Precios y Comisiones</Text>
                <View style={[styles.skeleton, { backgroundColor: tc.borderLight, height: 40, marginBottom: 12 }]} />
                <View style={[styles.skeleton, { backgroundColor: tc.borderLight, height: 40, marginBottom: 12 }]} />
                <View style={[styles.skeleton, { backgroundColor: tc.borderLight, height: 40, marginBottom: 12 }]} />
            </View>
        );
    }

    const daysUntilNext = differenceInDays(new Date(config.pricing_next_update), new Date());
    let badgeColor = '#22c55e'; // verde
    let badgeBg = 'rgba(34, 197, 94, 0.15)';
    if (daysUntilNext < 30) {
        badgeColor = '#ef4444'; // rojo
        badgeBg = 'rgba(239, 68, 68, 0.15)';
    } else if (daysUntilNext <= 60) {
        badgeColor = '#eab308'; // amarillo
        badgeBg = 'rgba(234, 179, 8, 0.15)';
    }

    const InputRow = ({ label, valueKey, suffix = '$' }: any) => (
        <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: tc.textSecondary }]}>{label}</Text>
            <View style={[styles.pricingInputContainer, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                {suffix === '$' && <Text style={{ color: tc.textMuted, marginRight: 4 }}>$</Text>}
                <TextInput
                    style={[styles.pricingInput, { color: tc.text }]}
                    keyboardType="numeric"
                    value={local[valueKey]}
                    onChangeText={t => setLocal({...local, [valueKey]: t.replace(/[^0-9.]/g, '')})}
                />
                {suffix === '%' && <Text style={{ color: tc.textMuted, marginLeft: 4 }}>%</Text>}
            </View>
        </View>
    );

    return (
        <View style={[styles.pricingCard, { backgroundColor: tc.bgCard, borderColor: '#FF6B35' }]}>
            <Text style={[styles.sectionTitle, { color: tc.text, marginBottom: 16 }]}>Precios y Comisiones</Text>
            
            <View style={{ gap: 12, marginBottom: 20 }}>
                <InputRow label="Plan Base" valueKey="plan_basic_price_ars" />
                <InputRow label="Plan Premium" valueKey="plan_premium_price_ars" />
                <InputRow label="Publicidad Diaria" valueKey="ad_price_daily" />
                <InputRow label="Publicidad Semanal" valueKey="ad_price_weekly" />
                <InputRow label="Publicidad Mensual" valueKey="ad_price_monthly" />
                <InputRow label="Comisión (Trial)" valueKey="trial_commission_rate" suffix="%" />
            </View>

            <View style={[styles.pricingDates, { backgroundColor: tc.bg }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: tc.textSecondary }}>Última actualización:</Text>
                    <Text style={{ fontSize: 12, color: tc.text, fontWeight: 'bold' }}>{config.pricing_last_updated}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: tc.textSecondary }}>Próxima actualización:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: tc.text, fontWeight: 'bold' }}>{config.pricing_next_update}</Text>
                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: badgeColor }}>
                                faltan {daysUntilNext} días
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.saveBtn, !hasChanges() && { opacity: 0.5 }]} 
                disabled={!hasChanges() || saving}
                onPress={handleSave}
            >
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
            </TouchableOpacity>
        </View>
    );
}

export default function AdminDashboardScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    
    const [metrics, setMetrics] = useState<Metrics>({ active: 0, trial: 0, trialEndingSoon: 0, inactive: 0 });
    const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingClaims, setPendingClaims] = useState(0);
    const [pendingAds, setPendingAds] = useState(0);
    const [pendingMissions, setPendingMissions] = useState(0);

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

            // Counts for nav cards
            const [claimsRes, adsRes, missionsRes] = await Promise.all([
                supabase.from('listing_claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('advertisements').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('mission_claims').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
            ]);
            setPendingClaims(claimsRes.count || 0);
            setPendingAds(adsRes.count || 0);
            setPendingMissions(missionsRes.count || 0);

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
                {/* BUSCADOR GLOBAL */}
                <View style={[styles.searchContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Search size={18} color={tc.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: tc.text }]}
                        placeholder="Buscar negocio, producto o servicio..."
                        placeholderTextColor={tc.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <XCircle size={18} color={tc.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ACCESOS RÁPIDOS */}
                <View style={styles.navCards}>
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/claims')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(59,130,246,0.12)' }]}><FileText size={18} color="#3b82f6" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Reclamos</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>{pendingClaims} pendientes</Text>
                        </View>
                        {pendingClaims > 0 && <View style={styles.alertDot} />}
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/ads')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(234,179,8,0.12)' }]}><Megaphone size={18} color="#eab308" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Publicidad</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>{pendingAds} pendientes</Text>
                        </View>
                        {pendingAds > 0 && <View style={styles.alertDot} />}
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/points')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(255,107,53,0.12)' }]}><Award size={18} color="#FF6B35" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Club Un Pique</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>Valor de puntos</Text>
                        </View>
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                    
                    {/* Nuevas Tarjetas Fase 2 */}
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/commissions')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}><DollarSign size={18} color="#10b981" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Comisiones</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>Cobros a negocios</Text>
                        </View>
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/subscriptions')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(168,85,247,0.12)' }]}><CreditCard size={18} color="#a855f7" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Suscripciones</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>Auditoría de planes</Text>
                        </View>
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/admin/missions')}>
                        <View style={[styles.navIconCircle, { backgroundColor: 'rgba(236,72,153,0.12)' }]}><Award size={18} color="#ec4899" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.navCardTitle, { color: tc.text }]}>Misiones Club</Text>
                            <Text style={[styles.navCardSub, { color: tc.textMuted }]}>{pendingMissions} pendientes</Text>
                        </View>
                        {pendingMissions > 0 && <View style={styles.alertDot} />}
                        <ChevronRight size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                </View>

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

                {/* SECCIÓN PRICING */}
                <PricingEditor />

                {/* SECCIÓN 3 — Botón Actualizar (Inline above list) */}
                <View style={styles.listHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Listado de Negocios</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <RefreshCw size={16} color={tc.textSecondary} />
                        <Text style={[styles.refreshText, { color: tc.textSecondary }]}>Actualizar</Text>
                    </TouchableOpacity>
                </View>

                {/* SECCIÓN 2 — Lista de negocios (filtrada por búsqueda) */}
                <View style={styles.listContainer}>
                    {businesses.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((business) => {
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        gap: 10,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Nunito Sans',
        ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any,
    },
    navCards: {
        gap: 8,
        marginBottom: 24,
    },
    navCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    navIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    navCardSub: {
        fontSize: 11,
        fontFamily: 'Nunito Sans',
        marginTop: 1,
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginRight: 4,
    },
    pricingCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
    },
    skeleton: {
        borderRadius: 8,
        opacity: 0.5,
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pricingLabel: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        fontFamily: 'Nunito Sans',
    },
    pricingInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        width: 120,
    },
    pricingInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any,
    },
    pricingDates: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    saveBtn: {
        backgroundColor: '#FF6B35',
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
});
