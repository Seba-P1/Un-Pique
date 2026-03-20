import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, DollarSign, Users, BarChart3, Award, Megaphone } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useAdminStore } from '../../stores/adminStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const { metrics, loading, fetchMetrics } = useAdminStore();

    useEffect(() => { fetchMetrics(); }, []);

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const numColumns = isMobile ? 2 : isTablet ? 3 : 4;
    const gap = 12;
    const padding = 16;
    const cardWidth = (Math.min(width, 1400) - (padding * 2) - (gap * (numColumns - 1))) / numColumns;

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

    const StatCard = ({ icon: Icon, label, value, color, subtitle }: any) => (
        <View style={[styles.statCard, {
            width: cardWidth, borderLeftColor: color, borderLeftWidth: 4,
            backgroundColor: tc.bgCard,
            ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
        }]}>
            <View style={styles.statHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Icon size={24} color={color} />
                </View>
                <Text style={[styles.statValue, { color: tc.text }]}>{value}</Text>
            </View>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{label}</Text>
            {subtitle && <Text style={[styles.statSubtitle, { color: tc.textMuted }]}>{subtitle}</Text>}
        </View>
    );

    const QuickAction = ({ icon: Icon, label, route, color }: any) => (
        <TouchableOpacity
            style={[styles.quickAction, {
                width: cardWidth, backgroundColor: tc.bgCard,
                ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
            }]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
        >
            <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
                <Icon size={28} color={color} />
            </View>
            <Text style={[styles.quickActionLabel, { color: tc.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    if (loading || !metrics) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Dashboard Admin</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: tc.textMuted }]}>Cargando métricas...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <View style={[styles.headerInner, { maxWidth: 1400, width: '100%', alignSelf: 'center' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Dashboard Admin</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.maxContainer}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: tc.text }]}>Ingresos Totales</Text>
                        <View style={styles.revenueCard}>
                            <Text style={styles.revenueAmount}>{formatCurrency(metrics.totalRevenue)}</Text>
                            <Text style={styles.revenueLabel}>Total Acumulado</Text>
                            <View style={styles.revenueBreakdown}>
                                <View style={styles.revenueItem}><Text style={styles.revenueItemLabel}>Hoy</Text><Text style={styles.revenueItemValue}>{formatCurrency(metrics.todayRevenue)}</Text></View>
                                <View style={styles.revenueItem}><Text style={styles.revenueItemLabel}>Semana</Text><Text style={styles.revenueItemValue}>{formatCurrency(metrics.weeklyRevenue)}</Text></View>
                                <View style={styles.revenueItem}><Text style={styles.revenueItemLabel}>Mes</Text><Text style={styles.revenueItemValue}>{formatCurrency(metrics.monthlyRevenue)}</Text></View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: tc.text }]}>Métricas Clave</Text>
                        <View style={styles.gridContainer}>
                            <StatCard icon={DollarSign} label="Comisiones" value={formatCurrency(metrics.totalCommissions)} color={colors.success} subtitle={`Pendientes: ${formatCurrency(metrics.pendingCommissions)}`} />
                            <StatCard icon={Award} label="Suscripciones Pro" value={metrics.totalProSubscriptions} color={colors.primary.DEFAULT} subtitle={`Ingresos: ${formatCurrency(metrics.proRevenue)}`} />
                            <StatCard icon={Megaphone} label="Publicidad Activa" value={metrics.activeAds} color={colors.warning} subtitle={`Ingresos: ${formatCurrency(metrics.adRevenue)}`} />
                            <StatCard icon={Users} label="Negocios Activos" value={metrics.activeBusinesses} color={colors.info} subtitle={`Total: ${metrics.totalBusinesses}`} />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: tc.text }]}>Acciones Rápidas</Text>
                        <View style={styles.gridContainer}>
                            <QuickAction icon={BarChart3} label="Comisiones" route="/admin/commissions" color={colors.success} />
                            <QuickAction icon={Award} label="Suscripciones" route="/admin/subscriptions" color={colors.primary.DEFAULT} />
                            <QuickAction icon={Megaphone} label="Publicidad" route="/admin/advertisements" color={colors.warning} />
                            <QuickAction icon={TrendingUp} label="Reportes" route="/admin/reports" color={colors.info} />
                        </View>
                    </View>

                    <View style={isDesktop ? styles.rowSection : {}}>
                        <View style={[styles.section, isDesktop && { flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Estadísticas Adicionales</Text>
                            <View style={[styles.additionalStats, { backgroundColor: tc.bgCard }]}>
                                <View style={[styles.additionalStatItem, { borderBottomColor: tc.borderLight }]}>
                                    <Text style={[styles.additionalStatLabel, { color: tc.textSecondary }]}>Pedidos Totales</Text>
                                    <Text style={[styles.additionalStatValue, { color: tc.text }]}>{metrics.totalOrders}</Text>
                                </View>
                                <View style={[styles.additionalStatItem, { borderBottomColor: tc.borderLight }]}>
                                    <Text style={[styles.additionalStatLabel, { color: tc.textSecondary }]}>Pedidos este Mes</Text>
                                    <Text style={[styles.additionalStatValue, { color: tc.text }]}>{metrics.monthlyOrders}</Text>
                                </View>
                                <View style={[styles.additionalStatItem, { borderBottomColor: tc.borderLight }]}>
                                    <Text style={[styles.additionalStatLabel, { color: tc.textSecondary }]}>Impresiones de Ads</Text>
                                    <Text style={[styles.additionalStatValue, { color: tc.text }]}>{metrics.totalImpressions.toLocaleString()}</Text>
                                </View>
                                <View style={[styles.additionalStatItem, { borderBottomColor: tc.borderLight }]}>
                                    <Text style={[styles.additionalStatLabel, { color: tc.textSecondary }]}>Clicks en Ads</Text>
                                    <Text style={[styles.additionalStatValue, { color: tc.text }]}>{metrics.totalClicks.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>

                        {metrics.expiringSoon > 0 && (
                            <View style={[styles.section, isDesktop && { flex: 0.4 }]}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Alertas</Text>
                                <View style={[styles.alertCard, { backgroundColor: tc.isDark ? '#3D2F00' : '#FFF3CD' }]}>
                                    <Text style={[styles.alertTitle, { color: tc.text }]}>⚠️ Atención</Text>
                                    <Text style={[styles.alertText, { color: tc.textSecondary }]}>
                                        {metrics.expiringSoon} suscripciones Pro vencen en los próximos 7 días
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { borderBottomWidth: 1 },
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    content: { flex: 1 },
    scrollContent: { alignItems: 'center' },
    maxContainer: { width: '100%', maxWidth: 1400 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, fontFamily: 'Nunito Sans' },
    section: { marginTop: 20, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, fontFamily: 'Nunito Sans' },
    revenueCard: { backgroundColor: colors.primary.DEFAULT, borderRadius: 16, padding: 24, alignItems: 'center' },
    revenueAmount: { fontSize: 36, fontWeight: '700', color: colors.white, fontFamily: 'Nunito Sans' },
    revenueLabel: { fontSize: 14, color: colors.white, opacity: 0.9, marginTop: 4, fontFamily: 'Nunito Sans' },
    revenueBreakdown: { flexDirection: 'row', marginTop: 20, gap: 20 },
    revenueItem: { alignItems: 'center' },
    revenueItemLabel: { fontSize: 12, color: colors.white, opacity: 0.8, fontFamily: 'Nunito Sans' },
    revenueItemValue: { fontSize: 16, fontWeight: '600', color: colors.white, marginTop: 4, fontFamily: 'Nunito Sans' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: { borderRadius: 12, padding: 16 },
    statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', fontFamily: 'Nunito Sans' },
    statLabel: { fontSize: 12, fontFamily: 'Nunito Sans' },
    statSubtitle: { fontSize: 11, marginTop: 4, fontFamily: 'Nunito Sans' },
    quickAction: { borderRadius: 12, padding: 16, alignItems: 'center' },
    quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickActionLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', fontFamily: 'Nunito Sans' },
    rowSection: { flexDirection: 'row', gap: 20 },
    additionalStats: { borderRadius: 12, padding: 16 },
    additionalStatItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
    additionalStatLabel: { fontSize: 14, fontFamily: 'Nunito Sans' },
    additionalStatValue: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans' },
    alertCard: { borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.warning },
    alertTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, fontFamily: 'Nunito Sans' },
    alertText: { fontSize: 14, fontFamily: 'Nunito Sans' },
});
