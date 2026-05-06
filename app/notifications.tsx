import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { useNotificationsStore, Notification } from '../stores/notificationsStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeColors } from '../hooks/useThemeColors';

// ── Helpers ──────────────────────────────────────────────────────
function getEmoji(type: string): string {
    switch (type) {
        case 'order': return '🛍️';
        case 'message': case 'comment': return '💬';
        case 'like': return '❤️';
        case 'service': return '🔧';
        case 'accommodation': return '🏠';
        case 'mission': return '🎯';
        case 'review': return '⭐';
        default: return '🔔';
    }
}

function getTimeAgo(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    return new Date(dateString).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// ── Animated Row Component ──────────────────────────────────────
function NotificationRow({ item, index, tc, onPress }: { item: Notification; index: number; tc: any; onPress: () => void }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(4)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, delay: index * 30, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 200, delay: index * 30, useNativeDriver: true }),
        ]).start();
    }, []);

    const emoji = item.emoji_type || getEmoji(item.type);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
                style={[styles.row, { opacity: item.is_read ? 0.75 : 1 }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Emoji circle */}
                <View style={[styles.emojiCircle, { backgroundColor: tc.bgInput }]}>
                    <Text style={styles.emojiText}>{emoji}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                </View>

                {/* Content */}
                <View style={styles.rowContent}>
                    <Text
                        style={[styles.rowTitle, { color: tc.text, fontWeight: item.is_read ? '400' : '700' }]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text style={[styles.rowBody, { color: tc.textSecondary }]} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <Text style={[styles.rowTime, { color: tc.textSecondary }]}>
                        {getTimeAgo(item.created_at)}
                    </Text>
                </View>

                {/* Chevron */}
                <ChevronRight size={14} color={tc.borderLight} />
            </TouchableOpacity>

            {/* Separator */}
            <View style={[styles.separator, { backgroundColor: tc.borderLight }]} />
        </Animated.View>
    );
}

// ── Main Screen ─────────────────────────────────────────────────
export default function NotificationsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotificationsStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            fetchNotifications(user.id).then(() => {
                markAllAsRead();
            });
        }
    }, [user]);

    const handlePress = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        switch (notification.type) {
            case 'order':
                router.push('/orders' as any);
                break;
            case 'message':
                if (notification.data?.room_id) {
                    router.push(`/chat/${notification.data.room_id}` as any);
                }
                break;
            case 'service':
                if (notification.data?.listing_id) {
                    router.push(`/directory/${notification.data.listing_id}` as any);
                }
                break;
            case 'like':
            case 'comment':
                router.push('/(tabs)/social' as any);
                break;
            default:
                break;
        }
    };

    const renderItem = ({ item, index }: { item: Notification; index: number }) => (
        <NotificationRow
            item={item}
            index={index}
            tc={tc}
            onPress={() => handlePress(item)}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Bell size={48} color={tc.borderLight} />
            <Text style={[styles.emptyTitle, { color: tc.text }]}>Estás al día</Text>
            <Text style={[styles.emptySubtext, { color: tc.textSecondary }]}>
                Cuando recibas notificaciones, aparecerán acá
            </Text>
        </View>
    );

    // Skeleton loading
    const skeletonOpacity = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(skeletonOpacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
                    Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            skeletonOpacity.stopAnimation();
        }
    }, [loading]);

    const renderLoading = () => (
        <View style={{ gap: 0 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Animated.View
                    key={i}
                    style={{
                        height: 72,
                        backgroundColor: tc.bgInput,
                        opacity: skeletonOpacity,
                        marginHorizontal: 16,
                        marginVertical: 6,
                        borderRadius: 12,
                    }}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Notificaciones</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Marcar todo leído</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Content */}
            {loading ? (
                renderLoading()
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        isDesktop && { maxWidth: 700, alignSelf: 'center', width: '100%' },
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: '700' },
    markAllBtn: { padding: 4 },
    markAllText: { color: '#FF6B35', fontSize: 13, fontWeight: '600' },
    listContent: { flexGrow: 1 },

    // Row
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        minHeight: 72, gap: 12,
    },
    emojiCircle: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    emojiText: { fontSize: 22 },
    unreadDot: {
        position: 'absolute', top: 0, right: 0,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
    rowContent: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 14 },
    rowBody: { fontSize: 13, lineHeight: 18 },
    rowTime: { fontSize: 11, marginTop: 2 },
    separator: { height: 1, marginHorizontal: 16 },

    // States
    emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
