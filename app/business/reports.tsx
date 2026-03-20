// Sales Reports Screen - Based on Stitch reportes_de_ventas design
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const PERIODS = ['Hoy', 'Semana', 'Mes', 'Año'];

export default function ReportsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [period, setPeriod] = useState('Semana');

    const stats = [
        { label: 'Ingresos', value: '$12,450', change: '+18%', positive: true, icon: DollarSign },
        { label: 'Pedidos', value: '87', change: '+12%', positive: true, icon: ShoppingBag },
        { label: 'Clientes', value: '52', change: '+8%', positive: true, icon: Users },
        { label: 'Ticket Promedio', value: '$143', change: '-3%', positive: false, icon: TrendingUp },
    ];

    const topProducts = [
        { name: 'Pizza Margarita', sold: 45, revenue: '$5,400' },
        { name: 'Hamburguesa Clásica', sold: 32, revenue: '$3,840' },
        { name: 'Empanadas (x6)', sold: 28, revenue: '$2,520' },
        { name: 'Milanesa Napolitana', sold: 22, revenue: '$2,640' },
        { name: 'Ensalada César', sold: 18, revenue: '$1,620' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Reportes de Ventas</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <View style={[styles.periodRow, { backgroundColor: tc.bgCard }]}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                            onPress={() => setPeriod(p)}
                        >
                            <Text style={[styles.periodText, { color: period === p ? 'white' : tc.textMuted }]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stat Cards */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <View key={i} style={[styles.statCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <View style={styles.statHeader}>
                                    <Icon size={20} color={tc.textMuted} />
                                    <View style={styles.changeRow}>
                                        {stat.positive ? <TrendingUp size={14} color="#22C55E" /> : <TrendingDown size={14} color="#EF4444" />}
                                        <Text style={{ color: stat.positive ? '#22C55E' : '#EF4444', fontSize: 12, fontWeight: 'bold' }}>{stat.change}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.statValue, { color: tc.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: tc.textMuted }]}>{stat.label}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Chart Placeholder */}
                <View style={[styles.chartCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.chartTitle, { color: tc.text }]}>Tendencia de Ingresos</Text>
                    <View style={[styles.chartPlaceholder, { borderColor: tc.borderLight }]}>
                        <View style={styles.chartBars}>
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                <View key={i} style={styles.barColumn}>
                                    <View style={[styles.bar, { height: `${h}%`, backgroundColor: i === 5 ? colors.primary.DEFAULT : `${colors.primary.DEFAULT}40` }]} />
                                    <Text style={[styles.barLabel, { color: tc.textMuted }]}>{['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Top Products */}
                <View style={[styles.topCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.chartTitle, { color: tc.text }]}>Productos Más Vendidos</Text>
                    {topProducts.map((product, i) => (
                        <View key={i} style={[styles.topRow, { borderBottomColor: tc.borderLight }]}>
                            <View style={[styles.rank, { backgroundColor: i < 3 ? `${colors.primary.DEFAULT}20` : tc.bgInput }]}>
                                <Text style={[styles.rankText, { color: i < 3 ? colors.primary.DEFAULT : tc.textMuted }]}>{i + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.topName, { color: tc.text }]}>{product.name}</Text>
                                <Text style={[styles.topSold, { color: tc.textMuted }]}>{product.sold} vendidos</Text>
                            </View>
                            <Text style={[styles.topRevenue, { color: tc.text }]}>{product.revenue}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    content: { padding: 16, gap: 16 },

    periodRow: { flexDirection: 'row', borderRadius: 9999, padding: 4 },
    periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9999 },
    periodBtnActive: { backgroundColor: colors.primary.DEFAULT },
    periodText: { fontSize: 14, fontWeight: 'bold' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: { width: '47%', borderRadius: 16, padding: 16, gap: 4, borderWidth: 1 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    statValue: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Nunito Sans', marginTop: 4 },
    statLabel: { fontSize: 13, fontWeight: '500' },

    chartCard: { borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    chartPlaceholder: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, padding: 12, justifyContent: 'flex-end' },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: '100%' },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '80%', borderRadius: 6, minHeight: 8 },
    barLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },

    topCard: { borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
    rank: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: 'bold' },
    topName: { fontSize: 15, fontWeight: '600' },
    topSold: { fontSize: 12 },
    topRevenue: { fontSize: 15, fontWeight: 'bold' },
});
