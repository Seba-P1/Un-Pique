import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, BarChart3 } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { useBusinessAnalyticsStore } from '../../stores/businessAnalyticsStore';
import { useBusinessStore } from '../../stores/businessStore';
import { supabase } from '../../lib/supabase';

const PERIODS = [
    { label: 'Hoy', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' }
];

export default function ReportsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    
    const { selectedBusiness } = useBusinessStore();
    const { salesData, topProducts, fetchSalesData, fetchTopProducts, loading } = useBusinessAnalyticsStore();

    const [realStats, setRealStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        ticket: 0
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBusiness) {
            fetchSalesData(selectedBusiness.id, period);
            fetchTopProducts(selectedBusiness.id, 5);
            fetchCustomStats(selectedBusiness.id, period);
        }
    }, [selectedBusiness, period]);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [loading]);

    const fetchCustomStats = async (bId: string, p: string) => {
        // Calculate basic stats for the selected period
        try {
            let dateFilter = new Date();
            if (p === 'day') dateFilter.setHours(0,0,0,0);
            if (p === 'week') dateFilter.setDate(dateFilter.getDate() - 7);
            if (p === 'month') dateFilter.setMonth(dateFilter.getMonth() - 1);

            const { data, error } = await supabase
                .from('orders')
                .select('total, customer_id')
                .eq('business_id', bId)
                .in('status', ['completed', 'delivered'])
                .gte('created_at', dateFilter.toISOString());

            if (data) {
                const totalRev = data.reduce((acc, curr) => acc + Number(curr.total), 0);
                const uniqueCustomers = new Set(data.map(d => d.customer_id)).size;
                const orderCount = data.length;
                
                setRealStats({
                    revenue: totalRev,
                    orders: orderCount,
                    customers: uniqueCustomers,
                    ticket: orderCount > 0 ? totalRev / orderCount : 0
                });
            }
        } catch (err) {}
    };

    const statsConfig = [
        { label: 'Ingresos', value: `$${realStats.revenue.toLocaleString()}`, icon: DollarSign, color: '#10B981' },
        { label: 'Pedidos', value: realStats.orders.toString(), icon: ShoppingBag, color: '#F59E0B' },
        { label: 'Clientes', value: realStats.customers.toString(), icon: Users, color: '#8B5CF6' },
        { label: 'Ticket Promedio', value: `$${realStats.ticket.toFixed(0)}`, icon: BarChart3, color: '#3B82F6' },
    ];

    const maxChartValue = salesData.length > 0 ? Math.max(...salesData.map(d => d.revenue)) : 0;

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
                <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Reportes de Ventas</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Period Selector Compacto */}
                <View style={{ backgroundColor: tc.bgCard }}>
                    <View style={[styles.periodRow, { backgroundColor: tc.bgInput }]}>
                        {PERIODS.map(p => {
                            const isActive = period === p.value;
                            return (
                                <TouchableOpacity
                                    key={p.value}
                                    style={[styles.periodBtn, isActive && { backgroundColor: tc.bgCard, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                                    onPress={() => setPeriod(p.value as any)}
                                >
                                    <Text style={[styles.periodText, { color: isActive ? tc.text : tc.textMuted }]}>{p.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
                    
                    {/* Stat Cards Grid */}
                    <View style={styles.statsGrid}>
                        {statsConfig.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <View key={i} style={[styles.statCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <View style={styles.statHeader}>
                                        <View style={[styles.iconWrapper, { backgroundColor: stat.color + '15' }]}>
                                            <Icon size={16} color={stat.color} />
                                        </View>
                                    </View>
                                    <Text style={[styles.statValue, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{stat.label}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Chart (Native UI) */}
                    <View style={[styles.chartCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.chartTitle, { color: tc.text }]}>Tendencia de Ingresos</Text>
                            <TrendingUp size={16} color={tc.textMuted} />
                        </View>
                        
                        <View style={styles.chartArea}>
                            {salesData.length === 0 ? (
                                <View style={styles.emptyChart}>
                                    <BarChart3 size={32} color={tc.borderLight} />
                                    <Text style={[styles.emptyChartText, { color: tc.textMuted }]}>No hay datos en este período</Text>
                                </View>
                            ) : (
                                <View style={styles.chartBars}>
                                    {salesData.map((d, i) => {
                                        const hPct = maxChartValue > 0 ? Math.max((d.revenue / maxChartValue) * 100, 5) : 5;
                                        return (
                                            <View key={i} style={styles.barColumn}>
                                                <View style={[
                                                    styles.bar, 
                                                    { 
                                                        height: `${hPct}%`, 
                                                        backgroundColor: d.revenue === maxChartValue ? colors.primary.DEFAULT : colors.primary.DEFAULT + '50' 
                                                    }
                                                ]} />
                                                <Text style={[styles.barLabel, { color: tc.textSecondary }]}>{d.label.slice(0, 3)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Top Products */}
                    <View style={[styles.topCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.chartTitle, { color: tc.text, marginBottom: 12 }]}>Productos Más Vendidos</Text>
                        
                        {topProducts.length === 0 ? (
                            <Text style={[styles.emptyChartText, { color: tc.textMuted, marginVertical: 20, textAlign: 'center' }]}>No hay ventas registradas</Text>
                        ) : (
                            topProducts.map((product, i) => (
                                <View key={product.productId} style={[styles.topRow, { borderBottomColor: tc.borderLight, borderBottomWidth: i === topProducts.length -1 ? 0 : 1 }]}>
                                    <View style={[styles.rank, { backgroundColor: i < 3 ? `${colors.primary.DEFAULT}15` : tc.bgInput }]}>
                                        <Text style={[styles.rankText, { color: i < 3 ? colors.primary.DEFAULT : tc.textMuted }]}>{i + 1}</Text>
                                    </View>
                                    <View style={styles.topInfo}>
                                        <Text style={[styles.topName, { color: tc.text }]} numberOfLines={1}>{product.productName}</Text>
                                        <Text style={[styles.topSold, { color: tc.textSecondary }]}>{product.totalQuantity} vendidos</Text>
                                    </View>
                                    <Text style={[styles.topRevenue, { color: tc.text }]}>${product.totalRevenue.toLocaleString()}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </Animated.ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    content: { padding: 16, gap: 16 },

    periodRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginHorizontal: 16, marginVertical: 12 },
    periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    periodText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: { width: '48%', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconWrapper: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: -0.5 },
    statLabel: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },

    chartCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    chartTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    chartArea: { height: 160, justifyContent: 'flex-end', paddingTop: 10 },
    emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyChartText: { fontSize: 13, fontFamily: 'Nunito Sans', fontWeight: '600' },
    
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%' },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '100%', maxWidth: 24, borderRadius: 6, minHeight: 4 },
    barLabel: { fontSize: 10, marginTop: 6, fontWeight: '700', fontFamily: 'Nunito Sans', height: 16 },

    topCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    rank: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 13, fontWeight: '800', fontFamily: 'Nunito Sans' },
    topInfo: { flex: 1 },
    topName: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    topSold: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans', marginTop: 2 },
    topRevenue: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
});
