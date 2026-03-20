import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, ShoppingBag, CheckCircle, XCircle } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const MOCK_ORDERS = [
    { id: '1', business_name: 'Burger King', total: 15400, status: 'completed', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), items: ['Whopper Doble Combo', 'Nuggets x10'] },
    { id: '2', business_name: 'Farmacia Danubio', total: 5200, status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), items: ['Ibuprofeno 600mg', 'Tafirol'] },
    { id: '3', business_name: 'Almacén El Bocha', total: 8900, status: 'cancelled', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), items: ['Coca Cola 2.25L', 'Fernet Branca 750ml'] },
];

export default function OrderHistoryScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const loading = false;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return colors.success;
            case 'pending': return colors.warning;
            case 'cancelled': return colors.danger;
            default: return tc.textMuted;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'Completado';
            case 'pending': return 'En curso';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={styles.businessInfo}>
                    <ShoppingBag size={20} color={tc.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.businessName, { color: tc.text }]}>{item.business_name}</Text>
                </View>
                <Text style={[styles.total, { color: tc.primary }]}>${item.total.toLocaleString()}</Text>
            </View>
            <View style={styles.itemsContainer}>
                <Text style={[styles.itemsText, { color: tc.textSecondary }]} numberOfLines={1}>{item.items.join(', ')}</Text>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: tc.borderLight }]}>
                <View style={styles.statusContainer}>
                    {item.status === 'completed' && <CheckCircle size={16} color={colors.success} />}
                    {item.status === 'pending' && <Clock size={16} color={colors.warning} />}
                    {item.status === 'cancelled' && <XCircle size={16} color={colors.danger} />}
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
                </View>
                <Text style={[styles.date, { color: tc.textMuted }]}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Mis Pedidos</Text>
                <View style={{ width: 40 }} />
            </View>
            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={tc.primary} /></View>
            ) : (
                <FlatList
                    data={MOCK_ORDERS}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <ShoppingBag size={48} color={tc.textMuted} />
                            <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin pedidos</Text>
                            <Text style={[styles.emptyText, { color: tc.textMuted }]}>Todavía no realizaste ningún pedido.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, gap: 16 },
    card: { borderRadius: 12, padding: 16, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    businessInfo: { flexDirection: 'row', alignItems: 'center' },
    businessName: { fontSize: 16, fontWeight: '600', fontFamily: 'Nunito Sans' },
    total: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },
    itemsContainer: { marginBottom: 12 },
    itemsText: { fontSize: 14, fontFamily: 'Nunito Sans' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 13, fontWeight: '500', fontFamily: 'Nunito Sans' },
    date: { fontSize: 12, fontFamily: 'Nunito Sans' },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center' },
});
