import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { XCircle, CreditCard, Clock, CalendarDays, Store } from 'lucide-react-native';
import colors from '../../constants/colors';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminSubscription {
    id: string;
    name: string;
    subscription_status: 'trial' | 'active' | 'inactive' | 'cancelled';
    subscription_plan: 'free' | 'base' | 'premium';
    trial_ends_at: string | null;
    subscription_end_date: string | null;
    created_at: string;
}

export default function AdminSubscriptionsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    
    const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'trial' | 'active' | 'inactive'>('all');

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    const fetchSubscriptions = useCallback(async () => {
        try {
            let query = supabase
                .from('businesses')
                .select(`id, name, subscription_status, subscription_plan, trial_ends_at, subscription_end_date, created_at`)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('subscription_status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            setSubscriptions(data as AdminSubscription[]);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            Alert.alert('Error', 'No se pudieron cargar las suscripciones.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubscriptions();
    };

    const handleCancelSub = (sub: AdminSubscription) => {
        Alert.alert(
            'Cancelar Suscripción',
            `¿Estás seguro que deseas cancelar la suscripción de "${sub.name}"? Esto detendrá sus servicios pagos.`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(sub.id);
                        try {
                            const { error } = await supabase
                                .from('businesses')
                                .update({ subscription_status: 'cancelled' })
                                .eq('id', sub.id);

                            if (error) throw error;

                            setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, subscription_status: 'cancelled' } : s));
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo cancelar la suscripción.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), "dd/MMM yyyy", { locale: es });
        } catch {
            return dateStr;
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'trial': return { bg: 'rgba(234,179,8,0.15)', color: '#eab308', label: 'TRIAL' };
            case 'active': return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'ACTIVA' };
            case 'inactive': return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', label: 'INACTIVA' };
            case 'cancelled': return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'CANCELADA' };
            default: return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', label: status.toUpperCase() };
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'premium': return '#a855f7';
            case 'base': return '#3b82f6';
            default: return '#64748b';
        }
    };

    const filters = [
        { key: 'all', label: 'Todas' },
        { key: 'trial', label: 'Trial' },
        { key: 'active', label: 'Activas' },
        { key: 'inactive', label: 'Inactivas' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Suscripciones" subtitle="ADMIN" leftIcon="back" />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Suscripciones" subtitle="ADMIN" leftIcon="back" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* Filters */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterScroll}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                >
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterTab, filter === f.key && { backgroundColor: '#FF6B35' }]}
                            onPress={() => setFilter(f.key as any)}
                        >
                            <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* List */}
                <View style={styles.listWrap}>
                    {subscriptions.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <CreditCard size={40} color={tc.textMuted} />
                            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                No hay suscripciones en este estado.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {subscriptions.map(sub => {
                                const st = getStatusConfig(sub.subscription_status);
                                const isTrial = sub.subscription_status === 'trial';
                                const isActive = sub.subscription_status === 'active';
                                
                                let trialDays = 0;
                                if (isTrial && sub.trial_ends_at) {
                                    trialDays = differenceInDays(new Date(sub.trial_ends_at), new Date());
                                }

                                return (
                                    <View key={sub.id} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                        {/* Header */}
                                        <View style={styles.cardHeader}>
                                            <View style={styles.bizRow}>
                                                <Store size={16} color={tc.text} />
                                                <Text style={[styles.bizName, { color: tc.text }]} numberOfLines={1}>{sub.name}</Text>
                                            </View>
                                            
                                            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                                            </View>
                                        </View>

                                        {/* Plan & Dates Grid */}
                                        <View style={[styles.grid, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                                            <View style={styles.gridItem}>
                                                <Text style={[styles.gridLabel, { color: tc.textMuted }]}>Plan Actual</Text>
                                                <Text style={[styles.planValue, { color: getPlanColor(sub.subscription_plan) }]}>
                                                    {sub.subscription_plan.toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={[styles.gridItem, styles.gridItemBorder, { borderColor: tc.borderLight }]}>
                                                <Text style={[styles.gridLabel, { color: tc.textMuted }]}>
                                                    {isTrial ? 'Fin de Trial' : isActive ? 'Vencimiento' : 'Creado en'}
                                                </Text>
                                                <View style={styles.dateRow}>
                                                    {isTrial ? <Clock size={12} color={tc.text} /> : <CalendarDays size={12} color={tc.text} />}
                                                    <Text style={[styles.dateValue, { color: tc.text }]}>
                                                        {isTrial ? formatDate(sub.trial_ends_at) : isActive ? formatDate(sub.subscription_end_date) : formatDate(sub.created_at)}
                                                    </Text>
                                                </View>
                                                {isTrial && (
                                                    <Text style={[styles.daysLeft, { color: trialDays <= 7 ? '#ef4444' : '#eab308' }]}>
                                                        Quedan {trialDays} días
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Actions */}
                                        {(isTrial || isActive) && (
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }]}
                                                onPress={() => handleCancelSub(sub)}
                                                disabled={processingId === sub.id}
                                            >
                                                {processingId === sub.id ? (
                                                    <ActivityIndicator size="small" color="#ef4444" />
                                                ) : (
                                                    <>
                                                        <XCircle size={16} color="#ef4444" />
                                                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cancelar suscripción</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    content: { paddingBottom: 80, maxWidth: 800, width: '100%', alignSelf: 'center' },
    filterScroll: { flexGrow: 0, marginTop: 16, marginBottom: 20 },
    filterTab: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
    },
    filterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#999' },
    listWrap: { paddingHorizontal: 16 },
    emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 15, fontFamily: 'Nunito Sans', textAlign: 'center' },
    list: { gap: 12 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    bizRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 },
    bizName: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },
    grid: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    gridItem: { flex: 1, padding: 12, justifyContent: 'center' },
    gridItemBorder: { borderLeftWidth: 1 },
    gridLabel: { fontSize: 10, fontWeight: '700', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    planValue: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateValue: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },
    daysLeft: { fontSize: 11, fontWeight: '700', fontFamily: 'Nunito Sans', marginTop: 4 },
    actionBtn: {
        marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 44, borderRadius: 10, borderWidth: 1,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' }
});
