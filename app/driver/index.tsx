import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, DollarSign, ChevronRight, Navigation } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { HeaderTypeA } from '../../components/ui';
import { useRouter } from 'expo-router';
import { useDriverOrders } from '../../hooks/useDriverOrders';

// Mock Data para pedidos asignados


export default function DriverDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const router = useRouter();
    const tc = useThemeColors();

    const toggleSwitch = () => setIsOnline(previousState => !previousState);

    const { data: orders = [], isLoading, refetch } = useDriverOrders();

    const onRefresh = () => {
        refetch();
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: tc.bgCard }]}
            onPress={() => router.push(`/driver/order/${item.id}` as any)}
            activeOpacity={0.9}
        >
            {/* Business Header */}
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.business?.logo_url || 'https://via.placeholder.com/100' }}
                    style={styles.businessAvatar}
                />
                <View style={styles.headerInfo}>
                    <Text style={[styles.businessName, { color: tc.text }]}>{item.business?.name || 'Comercio Desconocido'}</Text>
                    <Text style={[styles.orderId, { color: tc.textMuted }]}>#{item.id.slice(0, 8)}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'delivering' ? styles.statusBlue : styles.statusOrange]}>
                    <Text style={[styles.statusText, item.status === 'delivering' ? styles.textBlue : styles.textOrange]}>
                        {item.status === 'delivering' ? 'En Camino' : 'Retirar'}
                    </Text>
                </View>
            </View>

            {/* Route Info */}
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <View style={styles.dotOrigin} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.business?.address || 'Dirección de retiro'}</Text>
                </View>
                <View style={styles.connectorLine} />
                <View style={styles.routePoint}>
                    <View style={styles.dotDest} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.address || 'Dirección de entrega'}</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Navigation size={16} color={colors.gray[500]} />
                    <Text style={styles.statText}>2.5 km</Text>
                </View>
                <View style={styles.statItem}>
                    <Clock size={16} color={colors.gray[500]} />
                    <Text style={styles.statText}>20 min</Text>
                </View>
                <View style={styles.statItem}>
                    <DollarSign size={16} color={colors.gray[500]} />
                    <Text style={styles.statText}>Ganancia: ${item.delivery_fee}</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <Text style={styles.viewDetalis}>Ver Detalles</Text>
                <ChevronRight size={20} color={colors.primary.DEFAULT} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Custom Header for Driver */}
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <View>
                    <Text style={[styles.greeting, { color: tc.text }]}>Hola, Sebastián</Text>
                    <Text style={[styles.statusLabel, { color: tc.textSecondary }]}>
                        {isOnline ? 'Estás en línea' : 'Estás desconectado'}
                    </Text>
                </View>
                <View style={styles.switchContainer}>
                    <Switch
                        trackColor={{ false: colors.gray[300], true: colors.success }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.gray[300]}
                        onValueChange={toggleSwitch}
                        value={isOnline}
                    />
                </View>
            </View>

            {!isOnline ? (
                <View style={styles.offlineContainer}>
                    <View style={styles.offlineIconBg}>
                        <MapPin size={48} color={colors.gray[400]} />
                    </View>
                    <Text style={[styles.offlineTitle, { color: tc.text }]}>Estás desconectado</Text>
                    <Text style={[styles.offlineText, { color: tc.textSecondary }]}>
                        Activá tu estado para empezar a recibir pedidos de los comercios cercanos.
                    </Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Pedidos Asignados</Text>
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id}
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Buscando nuevos pedidos...</Text>
                            </View>
                        }
                    />
                </View>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    greeting: {
        fontFamily: 'Nunito Sans',
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
    },
    statusLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.gray[500],
        marginTop: 2,
    },
    switchContainer: {
        transform: [{ scale: 1.1 }],
    },
    offlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    offlineIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    offlineTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 22,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 12,
    },
    offlineText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[500],
        textAlign: 'center',
        lineHeight: 24,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: 16,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */




    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    businessAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    businessName: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray[900],
    },
    orderId: {
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        color: colors.gray[500],
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusOrange: {
        backgroundColor: '#FFF4E5',
    },
    statusBlue: {
        backgroundColor: '#E3F2FD',
    },
    statusText: {
        fontFamily: 'Nunito Sans',
        fontSize: 12,
        fontWeight: '600',
    },
    textOrange: {
        color: '#E65100',
    },
    textBlue: {
        color: '#1565C0',
    },
    routeContainer: {
        paddingLeft: 4,
        marginBottom: 16,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
    },
    connectorLine: {
        width: 2,
        height: 16,
        backgroundColor: colors.gray[200],
        marginLeft: 4, // Center with dots (10px wide -> center at 5px)
        marginVertical: 2,
    },
    dotOrigin: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.gray[900],
        marginRight: 12,
    },
    dotDest: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary.DEFAULT,
        marginRight: 12,
    },
    addressText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.gray[700],
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        color: colors.gray[600],
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 4,
    },
    viewDetalis: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary.DEFAULT,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Nunito Sans',
        color: colors.gray[400],
    }
});
