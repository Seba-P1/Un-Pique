import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Award, Clock, BarChart2 } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessAnalyticsStore } from '../../stores/businessAnalyticsStore';
import { useBusinessStore } from '../../stores/businessStore';

const { width } = Dimensions.get('window');

const PERIODS = [
    { label: 'Hoy', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' }
];

export default function BusinessAnalyticsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { salesData, topProducts, peakHours, loading, fetchSalesData, fetchTopProducts, fetchPeakHours } = useBusinessAnalyticsStore();
    const { selectedBusiness } = useBusinessStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBusiness) {
            fetchSalesData(selectedBusiness.id, selectedPeriod);
            fetchTopProducts(selectedBusiness.id, 5);
            fetchPeakHours(selectedBusiness.id);
        }
    }, [selectedBusiness, selectedPeriod]);

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

    const maxSalesValue = salesData.length > 0 ? Math.max(...salesData.map(d => d.revenue)) : 0;
    const maxPeakCount = peakHours.length > 0 ? Math.max(...peakHours.map(d => d.orderCount)) : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Analíticas Detalladas</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Period Selector Compacto */}
            <View style={{ backgroundColor: tc.bgCard }}>
                <View style={[styles.periodRow, { backgroundColor: tc.bgInput }]}>
                    {PERIODS.map(p => {
                        const isActive = selectedPeriod === p.value;
                        return (
                            <TouchableOpacity
                                key={p.value}
                                style={[styles.periodBtn, isActive && { backgroundColor: tc.bgCard, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                                onPress={() => setSelectedPeriod(p.value as any)}
                            >
                                <Text style={[styles.periodText, { color: isActive ? tc.text : tc.textMuted }]}>{p.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <Animated.ScrollView style={[styles.content, { opacity: fadeAnim }]} showsVerticalScrollIndicator={false}>
                    
                    {/* Sales Chart (Compact Native Bar) */}
                    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.cardHeader}>
                            <TrendingUp size={18} color={colors.primary.DEFAULT} />
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Tendencia de Ventas</Text>
                        </View>
                        
                        <View style={styles.chartArea}>
                            {salesData.length === 0 ? (
                                <View style={styles.emptyChart}>
                                    <BarChart2 size={32} color={tc.borderLight} />
                                    <Text style={[styles.emptyChartText, { color: tc.textMuted }]}>No hay ventas suficientes</Text>
                                </View>
                            ) : (
                                <View style={styles.chartBars}>
                                    {salesData.map((d, i) => {
                                        const hPct = maxSalesValue > 0 ? Math.max((d.revenue / maxSalesValue) * 100, 5) : 5;
                                        return (
                                            <View key={i} style={styles.barColumn}>
                                                <View style={[
                                                    styles.bar, 
                                                    { 
                                                        height: `${hPct}%`, 
                                                        backgroundColor: d.revenue === maxSalesValue ? colors.primary.DEFAULT : colors.primary.DEFAULT + '50' 
                                                    }
                                                ]} />
                                                <Text style={[styles.barLabel, { color: tc.textSecondary }]} numberOfLines={1}>
                                                    {d.label.slice(0, 3)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Peak Hours Grid (Taste Skill Density) */}
                    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.cardHeader}>
                            <Clock size={18} color={colors.info} />
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Horarios de Mayor Demanda</Text>
                        </View>
                        
                        {peakHours.length > 0 ? (
                            <View style={styles.hoursGrid}>
                                {peakHours.map((hour, index) => {
                                    const intensity = hour.orderCount / maxPeakCount;
                                    const bgOp = Math.max(0.1, intensity * 0.4);
                                    return (
                                        <View key={index} style={[styles.hourItem, { backgroundColor: `${colors.info}${Math.round(bgOp * 255).toString(16).padStart(2, '0')}` }]}>
                                            <Text style={[styles.hourTime, { color: tc.text }]}>{hour.hour}:00</Text>
                                            <Text style={[styles.hourPercentage, { color: colors.info }]}>{hour.percentage.toFixed(0)}%</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={[styles.emptyChartText, { color: tc.textMuted, marginVertical: 20, textAlign: 'center' }]}>No hay datos suficientes de horarios</Text>
                        )}
                    </View>

                    {/* Top Products */}
                    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.cardHeader}>
                            <Award size={18} color={colors.warning} />
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Productos Más Populares</Text>
                        </View>
                        
                        {topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                                <View key={product.productId} style={[styles.productItem, { borderBottomColor: tc.borderLight, borderBottomWidth: index === topProducts.length - 1 ? 0 : 1 }]}>
                                    <View style={[styles.productRank, { backgroundColor: index < 3 ? `${colors.warning}15` : tc.bgInput }]}>
                                        <Text style={[styles.rankNumber, { color: index < 3 ? colors.warning : tc.textMuted }]}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.productInfo}>
                                        <Text style={[styles.productName, { color: tc.text }]} numberOfLines={1}>{product.productName}</Text>
                                        <Text style={[styles.productStats, { color: tc.textSecondary }]}>
                                            {product.totalQuantity} ud. • ${product.totalRevenue.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.emptyChartText, { color: tc.textMuted, marginVertical: 20, textAlign: 'center' }]}>Sin productos vendidos aún</Text>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </Animated.ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
    backButton: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    periodRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginHorizontal: 16, marginVertical: 12 },
    periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    periodText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },

    content: { padding: 16 },

    card: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },

    chartArea: { height: 160, justifyContent: 'flex-end', paddingTop: 10 },
    emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyChartText: { fontSize: 13, fontFamily: 'Nunito Sans', fontWeight: '600' },
    
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%' },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '100%', maxWidth: 24, borderRadius: 6, minHeight: 4 },
    barLabel: { fontSize: 10, marginTop: 6, fontWeight: '700', fontFamily: 'Nunito Sans', height: 16 },

    hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    hourItem: { flex: 1, minWidth: '30%', padding: 12, borderRadius: 12, alignItems: 'center', gap: 4 },
    hourTime: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans' },
    hourPercentage: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },

    productItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    productRank: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankNumber: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 2 },
    productStats: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
});
