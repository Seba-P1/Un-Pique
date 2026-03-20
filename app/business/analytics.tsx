import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Award, Clock } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessAnalyticsStore } from '../../stores/businessAnalyticsStore';
import { useBusinessStore } from '../../stores/businessStore';

const { width } = Dimensions.get('window');

export default function BusinessAnalyticsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { salesData, topProducts, peakHours, loading, fetchSalesData, fetchTopProducts, fetchPeakHours } = useBusinessAnalyticsStore();
    const { selectedBusiness } = useBusinessStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    useEffect(() => {
        if (selectedBusiness) {
            fetchSalesData(selectedBusiness.id, selectedPeriod);
            fetchTopProducts(selectedBusiness.id, 5);
            fetchPeakHours(selectedBusiness.id);
        }
    }, [selectedBusiness, selectedPeriod]);

    const chartData = {
        labels: salesData.map(d => d.label),
        datasets: [{
            data: salesData.length > 0 ? salesData.map(d => d.revenue) : [0],
        }],
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Analytics</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <View style={[styles.periodSelector, { backgroundColor: tc.bgCard }]}>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('day')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'day' && styles.periodTextActive]}>
                            Hoy
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('week')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                            Semana
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                            Mes
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sales Chart */}
                <View style={[styles.chartCard, { backgroundColor: tc.bgCard }]}>
                    <View style={styles.cardHeader}>
                        <TrendingUp size={24} color={colors.primary.DEFAULT} />
                        <Text style={[styles.cardTitle, { color: tc.text }]}>Ventas</Text>
                    </View>
                    {salesData.length > 0 ? (
                        <LineChart
                            data={chartData}
                            width={width - 64}
                            height={220}
                            chartConfig={{
                                backgroundColor: colors.primary.DEFAULT,
                                backgroundGradientFrom: colors.primary.DEFAULT,
                                backgroundGradientTo: colors.primary.light,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: '6',
                                    strokeWidth: '2',
                                    stroke: colors.white,
                                },
                            }}
                            bezier
                            style={styles.chart}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>No hay datos para mostrar</Text>
                        </View>
                    )}
                </View>

                {/* Top Products */}
                <View style={[styles.card, { backgroundColor: tc.bgCard }]}>
                    <View style={styles.cardHeader}>
                        <Award size={24} color={colors.warning} />
                        <Text style={[styles.cardTitle, { color: tc.text }]}>Productos Más Vendidos</Text>
                    </View>
                    {topProducts.length > 0 ? (
                        topProducts.map((product, index) => (
                            <View key={product.productId} style={styles.productItem}>
                                <View style={styles.productRank}>
                                    <Text style={styles.rankNumber}>{index + 1}</Text>
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={[styles.productName, { color: tc.text }]}>{product.productName}</Text>
                                    <Text style={[styles.productStats, { color: tc.textSecondary }]}>
                                        {product.totalQuantity} vendidos • ${product.totalRevenue.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No hay datos disponibles</Text>
                    )}
                </View>

                {/* Peak Hours */}
                <View style={[styles.card, { backgroundColor: tc.bgCard }]}>
                    <View style={styles.cardHeader}>
                        <Clock size={24} color={colors.info} />
                        <Text style={[styles.cardTitle, { color: tc.text }]}>Horarios Pico</Text>
                    </View>
                    {peakHours.length > 0 ? (
                        peakHours.map((hour, index) => (
                            <View key={index} style={styles.hourItem}>
                                <Text style={styles.hourTime}>
                                    {hour.hour}:00 - {hour.hour + 1}:00
                                </Text>
                                <View style={styles.hourBar}>
                                    <View
                                        style={[
                                            styles.hourBarFill,
                                            { width: `${hour.percentage}%`, backgroundColor: colors.info },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.hourPercentage}>{hour.percentage.toFixed(0)}%</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No hay datos disponibles</Text>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: colors.primary.DEFAULT,
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[600],
        fontFamily: 'Nunito Sans',
    },
    periodTextActive: {
        color: colors.white,
    },
    chartCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyChart: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.gray[400],
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.DEFAULT + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary.DEFAULT,
        fontFamily: 'Nunito Sans',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    productStats: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    hourItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    hourTime: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.gray[700],
        width: 100,
        fontFamily: 'Nunito Sans',
    },
    hourBar: {
        flex: 1,
        height: 8,
        backgroundColor: colors.gray[100],
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    hourBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    hourPercentage: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.gray[700],
        width: 40,
        textAlign: 'right',
        fontFamily: 'Nunito Sans',
    },
});
