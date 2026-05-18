import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, DollarSign, Store, FileText } from 'lucide-react-native';
import colors from '../../constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommissionOrder {
    id: string;
    order_number: string;
    created_at: string;
    total: number;
    platform_commission_rate: number;
    platform_commission_amount: number;
    status: string;
    payment_status: 'pending' | 'paid';
    business_name: string;
}

export default function AdminCommissionsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    
    const [orders, setOrders] = useState<CommissionOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    const fetchCommissions = useCallback(async () => {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    id, order_number, created_at, total, 
                    platform_commission_rate, platform_commission_amount,
                    status, payment_status,
                    businesses!inner(name)
                `)
                .gt('platform_commission_amount', 0)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('payment_status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mapped: CommissionOrder[] = (data || []).map((o: any) => ({
                id: o.id,
                order_number: o.order_number,
                created_at: o.created_at,
                total: o.total,
                platform_commission_rate: o.platform_commission_rate,
                platform_commission_amount: o.platform_commission_amount,
                status: o.status,
                payment_status: o.payment_status,
                business_name: o.businesses?.name || 'Negocio',
            }));

            setOrders(mapped);
        } catch (error) {
            console.error('Error fetching commissions:', error);
            Alert.alert('Error', 'No se pudieron cargar las comisiones.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchCommissions();
    }, [fetchCommissions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCommissions();
    };

    const handleMarkAsPaid = (order: CommissionOrder) => {
        Alert.alert(
            'Marcar como cobrada',
            `¿Confirmas que recibiste el pago de $${order.platform_commission_amount.toLocaleString('es-AR')} del negocio "${order.business_name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setProcessingId(order.id);
                        try {
                            const { error } = await supabase
                                .from('orders')
                                .update({ payment_status: 'paid' })
                                .eq('id', order.id);

                            if (error) throw error;

                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'paid' } : o));
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo actualizar el estado.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
        } catch {
            return dateStr;
        }
    };

    const totalCommissions = orders.reduce((sum, o) => sum + o.platform_commission_amount, 0);

    const filters = [
        { key: 'all', label: 'Todas' },
        { key: 'pending', label: 'Pendientes' },
        { key: 'paid', label: 'Cobradas' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Comisiones" subtitle="ADMIN" leftIcon="back" />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Comisiones" subtitle="ADMIN" leftIcon="back" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: tc.bgCard, borderColor: '#FF6B35' }]}>
                    <View style={styles.heroIconWrap}>
                        <DollarSign size={28} color="#FF6B35" />
                    </View>
                    <Text style={[styles.heroLabel, { color: tc.textMuted }]}>
                        Total {filter === 'pending' ? 'Pendiente' : filter === 'paid' ? 'Cobrado' : 'Generado'}
                    </Text>
                    <Text style={[styles.heroValue, { color: tc.text }]}>
                        ${Math.round(totalCommissions).toLocaleString('es-AR')}
                    </Text>
                </View>

                {/* Filters */}
                <View style={styles.filterRow}>
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterTab, filter === f.key && { backgroundColor: '#FF6B35' }]}
                            onPress={() => setFilter(f.key as any)}
                        >
                            <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List */}
                {orders.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <FileText size={40} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                            No hay comisiones registradas todavía
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {orders.map(order => (
                            <View key={order.id} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                {/* Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.bizRow}>
                                        <Store size={16} color={tc.text} />
                                        <Text style={[styles.bizName, { color: tc.text }]} numberOfLines={1}>{order.business_name}</Text>
                                    </View>
                                    
                                    <View style={[
                                        styles.statusBadge, 
                                        { backgroundColor: order.payment_status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)' }
                                    ]}>
                                        <Text style={[
                                            styles.statusText, 
                                            { color: order.payment_status === 'paid' ? '#22c55e' : '#eab308' }
                                        ]}>
                                            {order.payment_status === 'paid' ? 'COBRADA' : 'PENDIENTE'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Meta */}
                                <Text style={[styles.metaText, { color: tc.textMuted }]}>
                                    Pedido #{order.order_number} • {formatDate(order.created_at)}
                                </Text>

                                {/* Calculation Row */}
                                <View style={[styles.calcBox, { backgroundColor: tc.bg }]}>
                                    <View style={styles.calcCol}>
                                        <Text style={[styles.calcLabel, { color: tc.textMuted }]}>Total Venta</Text>
                                        <Text style={[styles.calcValue, { color: tc.text }]}>${Math.round(order.total).toLocaleString('es-AR')}</Text>
                                    </View>
                                    <Text style={[styles.calcArrow, { color: tc.textMuted }]}>→</Text>
                                    <View style={styles.calcColRight}>
                                        <Text style={[styles.calcLabel, { color: tc.textMuted }]}>Comisión ({order.platform_commission_rate}%)</Text>
                                        <Text style={[styles.calcValue, { color: '#FF6B35' }]}>
                                            ${Math.round(order.platform_commission_amount).toLocaleString('es-AR')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action */}
                                {order.payment_status === 'pending' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { borderColor: tc.borderLight }]}
                                        onPress={() => handleMarkAsPaid(order)}
                                        disabled={processingId === order.id}
                                    >
                                        {processingId === order.id ? (
                                            <ActivityIndicator size="small" color={tc.text} />
                                        ) : (
                                            <>
                                                <CheckCircle size={16} color="#22c55e" />
                                                <Text style={[styles.actionBtnText, { color: tc.text }]}>Marcar cobrada</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
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
    heroCard: {
        borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 20,
    },
    heroIconWrap: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.12)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    heroLabel: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    heroValue: { fontSize: 36, fontWeight: '900', fontFamily: 'Nunito Sans' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterTab: {
        flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
    },
    filterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#999' },
    emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 15, fontFamily: 'Nunito Sans', textAlign: 'center' },
    list: { gap: 12 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    bizRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 },
    bizName: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },
    metaText: { fontSize: 13, fontFamily: 'Nunito Sans', marginBottom: 16 },
    calcBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
    calcCol: { flex: 1 },
    calcColRight: { flex: 1, alignItems: 'flex-end' },
    calcLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans', textTransform: 'uppercase', marginBottom: 2 },
    calcValue: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans' },
    calcArrow: { fontSize: 20, marginHorizontal: 12 },
    actionBtn: {
        marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 44, borderRadius: 10, borderWidth: 1,
    },
    actionBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' }
});
