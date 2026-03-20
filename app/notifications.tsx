import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useAuthStore } from '../stores/authStore';
import { NotificationItem } from '../components/ui';
import { useThemeColors } from '../hooks/useThemeColors';

export default function NotificationsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const {
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotificationsStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            fetchNotifications(user.id);
        }
    }, [user]);

    const handlePress = async (notification: any) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        switch (notification.type) {
            case 'order':
                break;
            case 'message':
                router.push('/(tabs)/social');
                break;
            case 'service':
                break;
        }
    };

    const renderItem = ({ item }: any) => (
        <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Bell size={48} color={tc.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>Estás al día</Text>
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                No tenés notificaciones nuevas por el momento.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Notificaciones</Text>
                <TouchableOpacity onPress={markAllAsRead} style={styles.readAllButton}>
                    <CheckCheck size={20} color={tc.primary} />
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tc.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
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
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold' },
    readAllButton: { padding: 8 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
    emptyIcon: { marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
