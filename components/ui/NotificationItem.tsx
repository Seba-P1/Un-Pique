import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MessageCircle, Heart, Star, ShoppingBag, Info } from 'lucide-react-native';
import colors from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
    notification: {
        id: string;
        type: 'order' | 'message' | 'like' | 'comment' | 'service';
        title: string;
        body: string;
        created_at: string;
        is_read: boolean;
    };
    onPress: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
    const getIcon = () => {
        switch (notification.type) {
            case 'order':
                return { icon: ShoppingBag, color: colors.primary.DEFAULT, bg: colors.primary.light };
            case 'message':
                return { icon: MessageCircle, color: colors.info, bg: '#DBEAFE' };
            case 'like':
                return { icon: Heart, color: colors.danger, bg: '#FEE2E2' };
            case 'service':
                return { icon: Star, color: colors.warning, bg: '#FEF3C7' };
            default:
                return { icon: Bell, color: colors.gray[500], bg: colors.gray[100] };
        }
    };

    const { icon: Icon, color, bg } = getIcon();

    return (
        <TouchableOpacity
            style={[styles.container, !notification.is_read && styles.unreadContainer]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: bg }]}>
                <Icon size={20} color={color} />
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, !notification.is_read && styles.unreadText]}>
                        {notification.title}
                    </Text>
                    {!notification.is_read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
                <Text style={styles.time}>
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    unreadContainer: {
        backgroundColor: colors.primary.light + '10', // Very light primary tint
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        color: colors.gray[900],
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
        flex: 1,
    },
    unreadText: {
        fontWeight: '700',
    },
    body: {
        fontSize: 14,
        color: colors.gray[600],
        marginBottom: 6,
        lineHeight: 20,
        fontFamily: 'Nunito Sans',
    },
    time: {
        fontSize: 12,
        color: colors.gray[400],
        fontFamily: 'Nunito Sans',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary.DEFAULT,
        marginLeft: 8,
    },
});
