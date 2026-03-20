import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessEarningsStore } from '../../stores/businessEarningsStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function BusinessEarningsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { summary, commissions, loading, fetchEarningsSummary, fetchCommissionHistory } = useBusinessEarningsStore();
    const { selectedBusiness } = useBusinessStore();

    useEffect(() => {
        if (selectedBusiness) {
            fetchEarningsSummary(selectedBusiness.id);
            fetchCommissionHistory(selectedBusiness.id);
        }
    }, [selectedBusiness]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-AR')}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Ganancias</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {summary && (
                    <>
                        {/* Net Earnings Card */}
                        <View style={styles.earningsCard}>
                            <DollarSign size={32} color={colors.white} />
                            <Text style={styles.earningsLabel}>Ganancias Netas</Text>
                            <Text style={styles.earningsAmount}>
                                {formatCurrency(summary.netEarnings)}
                            </Text>
                            <Text style={styles.earningsSubtext}>
                                Después de comisiones y delivery
                            </Text>
                        </View>

                        {/* Breakdown Card */}
                        <View style={[styles.card, { backgroundColor: tc.bgCard }]}>
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Desglose</Text>

                            <View style={styles.breakdownItem}>
                                <View style={styles.breakdownLabel}>
                                    <TrendingUp size={20} color={colors.success} />
                                    <Text style={styles.breakdownText}>Ventas Brutas</Text>
                                </View>
                                <Text style={styles.breakdownValue}>
                                    {formatCurrency(summary.grossRevenue)}
                                </Text>
                            </View>

                            <View style={styles.breakdownItem}>
                                <View style={styles.breakdownLabel}>
                                    <TrendingDown size={20} color={colors.danger} />
                                    <Text style={styles.breakdownText}>
                                        Comisiones ({(summary.currentCommissionRate * 100).toFixed(0)}%)
                                    </Text>
                                </View>
                                <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                                    -{formatCurrency(summary.totalCommissions)}
                                </Text>
                            </View>

                            <View style={styles.breakdownItem}>
                                <View style={styles.breakdownLabel}>
                                    <TrendingDown size={20} color={colors.danger} />
                                    <Text style={styles.breakdownText}>Delivery</Text>
                                </View>
                                <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                                    -{formatCurrency(summary.totalDeliveryFees)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.breakdownItem}>
                                <Text style={styles.totalLabel}>Total Neto</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(summary.netEarnings)}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Card */}
                        <View style={[styles.statsCard, { backgroundColor: tc.bgCard }]}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{summary.totalOrders}</Text>
                                <Text style={styles.statLabel}>Pedidos Totales</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {formatCurrency(summary.grossRevenue / (summary.totalOrders || 1))}
                                </Text>
                                <Text style={styles.statLabel}>Ticket Promedio</Text>
                            </View>
                        </View>

                        {/* Commission Rate Info */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>
                                {summary.currentCommissionRate === 0.04 ? '👑 Plan Pro' : '📦 Plan Gratis'}
                            </Text>
                            <Text style={styles.infoText}>
                                Estás pagando {(summary.currentCommissionRate * 100).toFixed(0)}% de comisión por cada venta.
                            </Text>
                            {summary.currentCommissionRate === 0.09 && (
                                <TouchableOpacity
                                    style={styles.upgradeButton}
                                    onPress={() => router.push('/business/subscription' as any)}
                                >
                                    <Text style={styles.upgradeButtonText}>
                                        Upgrade a Pro (4% comisión)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                {/* Commission History */}
                <View style={[styles.card, { backgroundColor: tc.bgCard }]}>
                    <View style={styles.cardHeader}>
                        <Receipt size={24} color={colors.gray[700]} />
                        <Text style={styles.cardTitle}>Historial de Comisiones</Text>
                    </View>

                    {commissions.length > 0 ? (
                        commissions.slice(0, 10).map((commission) => (
                            <View key={commission.id} style={styles.commissionItem}>
                                <View style={styles.commissionInfo}>
                                    <Text style={styles.commissionDate}>
                                        {formatDate(commission.createdAt)}
                                    </Text>
                                    <Text style={styles.commissionRate}>
                                        {(commission.commissionRate * 100).toFixed(0)}% • Pedido #{commission.orderId.slice(0, 8)}
                                    </Text>
                                </View>
                                <View style={styles.commissionAmounts}>
                                    <Text style={styles.commissionTotal}>
                                        {formatCurrency(commission.totalAmount)}
                                    </Text>
                                    <Text style={styles.commissionFee}>
                                        -{formatCurrency(commission.commissionAmount)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No hay comisiones registradas</Text>
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
    earningsCard: {
        backgroundColor: colors.success,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    earningsLabel: {
        fontSize: 14,
        color: colors.white,
        opacity: 0.9,
        marginTop: 8,
        fontFamily: 'Nunito Sans',
    },
    earningsAmount: {
        fontSize: 40,
        fontWeight: '700',
        color: colors.white,
        marginTop: 8,
        fontFamily: 'Nunito Sans',
    },
    earningsSubtext: {
        fontSize: 12,
        color: colors.white,
        opacity: 0.8,
        marginTop: 4,
        fontFamily: 'Nunito Sans',
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
        marginBottom: 16,
        fontFamily: 'Nunito Sans',
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    breakdownLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakdownText: {
        fontSize: 14,
        color: colors.gray[700],
        fontFamily: 'Nunito Sans',
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[100],
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.success,
        fontFamily: 'Nunito Sans',
    },
    statsCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.gray[100],
        marginHorizontal: 16,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    statLabel: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 4,
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
    infoCard: {
        backgroundColor: '#FFF5F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary.DEFAULT,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 8,
        fontFamily: 'Nunito Sans',
    },
    infoText: {
        fontSize: 14,
        color: colors.gray[700],
        lineHeight: 20,
        fontFamily: 'Nunito Sans',
    },
    upgradeButton: {
        backgroundColor: colors.primary.DEFAULT,
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 12,
        alignItems: 'center',
    },
    upgradeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        fontFamily: 'Nunito Sans',
    },
    commissionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    commissionInfo: {
        flex: 1,
    },
    commissionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    commissionRate: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    commissionAmounts: {
        alignItems: 'flex-end',
    },
    commissionTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    commissionFee: {
        fontSize: 12,
        color: colors.danger,
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    emptyText: {
        fontSize: 14,
        color: colors.gray[400],
        textAlign: 'center',
        paddingVertical: 20,
        fontFamily: 'Nunito Sans',
    },
});
