// Seller Notifications Screen - Based on Stitch notificaciones design
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ShoppingBag, Star, AlertTriangle, CheckCircle, Package, MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const MOCK_NOTIFICATIONS = [
    { id: '1', type: 'order', title: 'Nuevo Pedido', message: 'David Miller realizó el pedido #5821', time: 'Hace 5 min', read: false },
    { id: '2', type: 'review', title: 'Nueva Reseña', message: 'Sarah Chen dejó una reseña de 5 ★', time: 'Hace 15 min', read: false },
    { id: '3', type: 'order', title: 'Pedido Completado', message: 'Pedido #5818 fue entregado exitosamente', time: 'Hace 1 hora', read: true },
    { id: '4', type: 'alert', title: 'Stock Bajo', message: 'Tarta de Manzana tiene solo 3 unidades', time: 'Hace 2 horas', read: true },
    { id: '5', type: 'message', title: 'Mensaje de Cliente', message: 'Ana García: "¿Tienen opciones veganas?"', time: 'Hace 3 horas', read: true },
    { id: '6', type: 'order', title: 'Pedido Cancelado', message: 'Mike Johnson canceló el pedido #5819', time: 'Hace 4 horas', read: true },
    { id: '7', type: 'system', title: 'Actualización Disponible', message: 'Nueva versión de la app disponible', time: 'Ayer', read: true },
];

const iconMap: any = {
    order: ShoppingBag,
    review: Star,
    alert: AlertTriangle,
    message: MessageCircle,
    system: Bell,
};

const colorMap: any = {
    order: '#3B82F6',
    review: '#F59E0B',
    alert: '#EF4444',
    message: '#22C55E',
    system: '#8B5CF6',
};

export default function SellerNotificationsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const renderNotification = ({ item }: any) => {
        const Icon = iconMap[item.type] || Bell;
        const iconColor = colorMap[item.type] || tc.textMuted;

        return (
            <TouchableOpacity
                style={[
                    styles.notifCard,
                    { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
                    !item.read && { borderLeftWidth: 3, borderLeftColor: colors.primary.DEFAULT }
                ]}
                activeOpacity={0.8}
                onPress={() => {
                    // Marcar como leída
                    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                    // Navegar según tipo
                    if (item.type === 'order') router.push('/business/order-details' as any);
                    else if (item.type === 'alert') router.push('/business/products' as any);
                    else if (item.type === 'message') router.push('/business/order-history' as any);
                }}
            >
                <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
                    <Icon size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: tc.text }]}>{item.title}</Text>
                        {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.notifMessage, { color: tc.textSecondary }]}>{item.message}</Text>
                    <Text style={[styles.notifTime, { color: tc.textMuted }]}>{item.time}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Notificaciones</Text>
                    {unreadCount > 0 ? (
                        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                            <CheckCircle size={18} color={colors.primary.DEFAULT} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </SafeAreaView>

            {unreadCount > 0 && (
                <View style={[styles.unreadBanner, { backgroundColor: `${colors.primary.DEFAULT}15` }]}>
                    <Text style={[styles.unreadText, { color: colors.primary.DEFAULT }]}>
                        {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
                    </Text>
                </View>
            )}

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Bell size={48} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay notificaciones</Text>
                    </View>
                }
            />
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
    markAllBtn: { padding: 8 },

    unreadBanner: { paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
    unreadText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    list: { padding: 16, gap: 10, paddingBottom: 32 },
    notifCard: { flexDirection: 'row', padding: 14, borderRadius: 16, gap: 12, borderWidth: 1 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    notifTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary.DEFAULT },
    notifMessage: { fontSize: 13, marginTop: 2, lineHeight: 18 },
    notifTime: { fontSize: 12, marginTop: 4 },

    empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});
