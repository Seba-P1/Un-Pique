import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { useBusinessAnalyticsStore } from '../../stores/businessAnalyticsStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function PerformanceScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    
    const { topProducts, loading, fetchTopProducts } = useBusinessAnalyticsStore();
    const { selectedBusiness } = useBusinessStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBusiness) {
            // Traemos los 10 mejores para rendimiento
            fetchTopProducts(selectedBusiness.id, 10);
        }
    }, [selectedBusiness]);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [loading]);

    const totalOrders = topProducts.reduce((acc, p) => acc + p.totalQuantity, 0);
    const totalRevenue = topProducts.reduce((acc, p) => acc + p.totalRevenue, 0);

    const overallStats = [
        { label: 'Unidades Vendidas', value: totalOrders.toString(), icon: ShoppingCart },
        { label: 'Top Productos', value: topProducts.length.toString(), icon: Package },
        { label: 'Ingresos Top', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
                <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Rendimiento de Productos</Text>
                    <View style={{ width: 38 }} />
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
                    
                    {/* Overview Stats Compact */}
                    <View style={styles.statsRow}>
                        {overallStats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <View key={i} style={[styles.statCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <View style={[styles.iconWrap, { backgroundColor: colors.primary.DEFAULT + '15' }]}>
                                        <Icon size={16} color={colors.primary.DEFAULT} />
                                    </View>
                                    <Text style={[styles.statValue, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{stat.label}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Product Performance List */}
                    <View style={[styles.listCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.sectionHeader}>
                            <TrendingUp size={18} color={colors.primary.DEFAULT} />
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Análisis por Producto</Text>
                        </View>
                        
                        {topProducts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Package size={32} color={tc.borderLight} style={{ marginBottom: 8 }} />
                                <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay ventas suficientes para medir rendimiento.</Text>
                            </View>
                        ) : (
                            topProducts.map((product, i) => {
                                const maxRevenue = Math.max(...topProducts.map(p => p.totalRevenue));
                                const barWidth = maxRevenue > 0 ? (product.totalRevenue / maxRevenue) * 100 : 0;
                                
                                return (
                                    <View key={product.productId} style={[styles.productRow, { borderBottomColor: tc.borderLight, borderBottomWidth: i === topProducts.length - 1 ? 0 : 1 }]}>
                                        
                                        <View style={styles.productInfoWrap}>
                                            <View style={[styles.rankBadge, { backgroundColor: i < 3 ? colors.primary.DEFAULT + '20' : tc.bgInput }]}>
                                                <Text style={[styles.rankText, { color: i < 3 ? colors.primary.DEFAULT : tc.textMuted }]}>{i + 1}</Text>
                                            </View>
                                            
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.productName, { color: tc.text }]} numberOfLines={1}>{product.productName}</Text>
                                                <View style={styles.metricsRow}>
                                                    <View style={styles.metric}>
                                                        <ShoppingCart size={10} color={tc.textMuted} />
                                                        <Text style={[styles.metricText, { color: tc.textSecondary }]}>{product.totalQuantity} ud.</Text>
                                                    </View>
                                                    <View style={styles.metric}>
                                                        <DollarSign size={10} color={tc.textMuted} />
                                                        <Text style={[styles.metricText, { color: tc.textSecondary }]}>${product.totalRevenue.toLocaleString()}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        {/* Trend Bar */}
                                        <View style={styles.trendContainer}>
                                            <View style={[styles.trendBarBg, { backgroundColor: tc.bgInput }]}>
                                                <View style={[styles.trendBarFill, { width: `${Math.max(barWidth, 5)}%`, backgroundColor: i < 3 ? colors.primary.DEFAULT : colors.primary.DEFAULT + '60' }]} />
                                            </View>
                                            <Text style={[styles.trendLabel, { color: tc.textMuted }]}>{barWidth.toFixed(0)}% del máx</Text>
                                        </View>
                                    </View>
                                );
                            })
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

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, gap: 4 },
    iconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
    statValue: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans' },
    statLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'Nunito Sans', lineHeight: 14 },

    listCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },

    productRow: { paddingVertical: 14, gap: 10 },
    productInfoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rankBadge: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans' },
    productName: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 4 },
    
    metricsRow: { flexDirection: 'row', gap: 12 },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metricText: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    
    trendContainer: { marginTop: 4 },
    trendBarBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
    trendBarFill: { height: '100%', borderRadius: 3 },
    trendLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'Nunito Sans', marginTop: 4, textAlign: 'right' },
    
    emptyState: { paddingVertical: 30, alignItems: 'center' },
    emptyText: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans', textAlign: 'center' }
});
