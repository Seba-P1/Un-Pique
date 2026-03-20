// Product Performance Analytics - Based on Stitch rendimiento_de_productos design
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Star, Eye, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const PRODUCTS_PERF = [
    { name: 'Pizza Margarita', views: 320, orders: 45, rating: 4.8, trend: '+15%', positive: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=200' },
    { name: 'Hamburguesa Clásica', views: 280, orders: 32, rating: 4.5, trend: '+8%', positive: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200' },
    { name: 'Empanadas (x6)', views: 245, orders: 28, rating: 4.7, trend: '+22%', positive: true, image: 'https://images.unsplash.com/photo-1601564921647-b446bf6e0710?q=80&w=200' },
    { name: 'Milanesa Napolitana', views: 190, orders: 22, rating: 4.3, trend: '-5%', positive: false, image: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?q=80&w=200' },
    { name: 'Ensalada César', views: 150, orders: 18, rating: 4.1, trend: '+3%', positive: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200' },
];

export default function PerformanceScreen() {
    const tc = useThemeColors();
    const router = useRouter();

    const overallStats = [
        { label: 'Vistas Totales', value: '1,185', icon: Eye },
        { label: 'Pedidos Totales', value: '145', icon: ShoppingCart },
        { label: 'Rating Promedio', value: '4.5', icon: Star },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Rendimiento de Productos</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Overview Stats */}
                <View style={styles.statsRow}>
                    {overallStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <View key={i} style={[styles.statCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <Icon size={20} color={colors.primary.DEFAULT} />
                                <Text style={[styles.statValue, { color: tc.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: tc.textMuted }]}>{stat.label}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Product Performance List */}
                <View style={[styles.listCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Rendimiento por Producto</Text>
                    {PRODUCTS_PERF.map((product, i) => (
                        <View key={i} style={[styles.productRow, { borderBottomColor: tc.borderLight }]}>
                            <Image source={{ uri: product.image }} style={styles.productImage} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.productName, { color: tc.text }]}>{product.name}</Text>
                                <View style={styles.metricsRow}>
                                    <View style={styles.metric}>
                                        <Eye size={12} color={tc.textMuted} />
                                        <Text style={[styles.metricText, { color: tc.textMuted }]}>{product.views}</Text>
                                    </View>
                                    <View style={styles.metric}>
                                        <ShoppingCart size={12} color={tc.textMuted} />
                                        <Text style={[styles.metricText, { color: tc.textMuted }]}>{product.orders}</Text>
                                    </View>
                                    <View style={styles.metric}>
                                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                        <Text style={[styles.metricText, { color: tc.textMuted }]}>{product.rating}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.trendBadge}>
                                {product.positive ? (
                                    <ArrowUpRight size={14} color="#22C55E" />
                                ) : (
                                    <ArrowDownRight size={14} color="#EF4444" />
                                )}
                                <Text style={{ color: product.positive ? '#22C55E' : '#EF4444', fontSize: 13, fontWeight: 'bold' }}>
                                    {product.trend}
                                </Text>
                            </View>
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

    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
    statValue: { fontSize: 22, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

    listCard: { borderRadius: 16, padding: 16, gap: 8, borderWidth: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans', marginBottom: 4 },

    productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
    productImage: { width: 48, height: 48, borderRadius: 10 },
    productName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    metricsRow: { flexDirection: 'row', gap: 12 },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metricText: { fontSize: 12 },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
