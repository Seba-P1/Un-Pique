import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Receipt, ShoppingBag } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessEarningsStore } from '../../stores/businessEarningsStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function BusinessEarningsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { summary, commissions, loading, fetchEarningsSummary, fetchCommissionHistory } = useBusinessEarningsStore();
    const { selectedBusiness } = useBusinessStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBusiness) {
            fetchEarningsSummary(selectedBusiness.id);
            fetchCommissionHistory(selectedBusiness.id);
        }
    }, [selectedBusiness]);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [loading]);

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Resumen de Ganancias</Text>
                <View style={{ width: 38 }} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
                    {summary ? (
                        <>
                            {/* Net Earnings Hero Card */}
                            <View style={[styles.heroCard, { backgroundColor: colors.success }]}>
                                <View style={styles.heroHeader}>
                                    <View style={styles.heroIconWrap}>
                                        <DollarSign size={20} color={colors.success} />
                                    </View>
                                    <Text style={styles.heroLabel}>Ganancia Neta Mensual</Text>
                                </View>
                                <Text style={styles.heroAmount}>{formatCurrency(summary.netEarnings)}</Text>
                            </View>

                            {/* Two-Column Stats */}
                            <View style={styles.statsRow}>
                                <View style={[styles.statBox, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <View style={[styles.iconWrapSm, { backgroundColor: '#F59E0B15' }]}>
                                        <ShoppingBag size={14} color="#F59E0B" />
                                    </View>
                                    <Text style={[styles.statVal, { color: tc.text }]}>{summary.totalOrders}</Text>
                                    <Text style={[styles.statSub, { color: tc.textSecondary }]}>Ventas</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <View style={[styles.iconWrapSm, { backgroundColor: '#3B82F615' }]}>
                                        <TrendingUp size={14} color="#3B82F6" />
                                    </View>
                                    <Text style={[styles.statVal, { color: tc.text }]}>{formatCurrency(summary.grossRevenue / (summary.totalOrders || 1))}</Text>
                                    <Text style={[styles.statSub, { color: tc.textSecondary }]}>Ticket Promedio</Text>
                                </View>
                            </View>

                            {/* Breakdown */}
                            <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <Text style={[styles.cardTitle, { color: tc.text }]}>Desglose Financiero</Text>

                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdLabel, { color: tc.text }]}>Ingresos Brutos</Text>
                                    <Text style={[styles.bdVal, { color: tc.text }]}>{formatCurrency(summary.grossRevenue)}</Text>
                                </View>
                                
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdLabel, { color: tc.textSecondary }]}>Comisión Un Pique ({(summary.currentCommissionRate * 100).toFixed(0)}%)</Text>
                                    <Text style={[styles.bdVal, { color: colors.danger }]}>-{formatCurrency(summary.totalCommissions)}</Text>
                                </View>
                                
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdLabel, { color: tc.textSecondary }]}>Cargos de Delivery</Text>
                                    <Text style={[styles.bdVal, { color: colors.danger }]}>-{formatCurrency(summary.totalDeliveryFees)}</Text>
                                </View>

                                <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                                
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.totalLabel, { color: tc.text }]}>Total Neto a Recibir</Text>
                                    <Text style={[styles.totalVal, { color: colors.success }]}>{formatCurrency(summary.netEarnings)}</Text>
                                </View>
                            </View>

                            {/* Plan Info */}
                            {summary.currentCommissionRate === 0.09 && (
                                <View style={[styles.planCard, { borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.planTitle, { color: tc.text }]}>Plan Básico Activo</Text>
                                        <Text style={[styles.planDesc, { color: tc.textSecondary }]}>
                                            Estás pagando 9% por venta. ¡Pásate a Pro y baja al 4%!
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.planBtn}
                                        onPress={() => router.push('/business/subscription' as any)}
                                    >
                                        <Text style={styles.planBtnText}>Mejorar Plan</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    ) : null}

                    {/* Commission History */}
                    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, marginTop: 4 }]}>
                        <View style={styles.cardHeader}>
                            <Receipt size={18} color={colors.primary.DEFAULT} />
                            <Text style={[styles.cardTitle, { color: tc.text, marginBottom: 0 }]}>Historial de Cobros</Text>
                        </View>

                        {commissions.length > 0 ? (
                            commissions.slice(0, 8).map((commission, i) => (
                                <View key={commission.id} style={[styles.historyRow, { borderBottomColor: tc.borderLight, borderBottomWidth: i === 7 || i === commissions.length -1 ? 0 : 1 }]}>
                                    <View>
                                        <Text style={[styles.histDate, { color: tc.text }]}>{formatDate(commission.createdAt)}</Text>
                                        <Text style={[styles.histOrder, { color: tc.textSecondary }]}>Pedido #{commission.orderId.slice(0, 5)} ({(commission.commissionRate * 100).toFixed(0)}%)</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.histAmount, { color: tc.text }]}>{formatCurrency(commission.totalAmount)}</Text>
                                        <Text style={[styles.histFee, { color: colors.danger }]}>-{formatCurrency(commission.commissionAmount)}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay comisiones aún</Text>
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
    
    content: { padding: 16, gap: 12 },

    heroCard: { borderRadius: 16, padding: 20, shadowColor: colors.success, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    heroIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    heroLabel: { fontSize: 14, fontWeight: '700', color: '#FFF', fontFamily: 'Nunito Sans', opacity: 0.9 },
    heroAmount: { fontSize: 36, fontWeight: '800', color: '#FFF', fontFamily: 'Nunito Sans', letterSpacing: -1 },

    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 4 },
    iconWrapSm: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    statVal: { fontSize: 20, fontWeight: '800', fontFamily: 'Nunito Sans' },
    statSub: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },

    card: { borderRadius: 16, padding: 16, borderWidth: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },

    breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    bdLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans' },
    bdVal: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    
    divider: { height: 1, marginVertical: 12 },
    
    totalLabel: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
    totalVal: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans' },

    planCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
    planTitle: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    planDesc: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans', lineHeight: 16 },
    planBtn: { backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    planBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800', fontFamily: 'Nunito Sans' },

    historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    histDate: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 2 },
    histOrder: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    histAmount: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 2 },
    histFee: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },
    
    emptyText: { fontSize: 13, textAlign: 'center', marginVertical: 20, fontWeight: '600', fontFamily: 'Nunito Sans' },
});
