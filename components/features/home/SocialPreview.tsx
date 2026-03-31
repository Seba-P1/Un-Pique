import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MessageCircle, Heart, PenLine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useSocialStore } from '../../../stores/socialStore';
import { useLocationStore } from '../../../stores/locationStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const SocialPreview = () => {
    const tc = useThemeColors();
    const router = useRouter();
    const { posts, fetchPosts } = useSocialStore();
    const { currentLocality } = useLocationStore();

    useEffect(() => {
        if (currentLocality && posts.length === 0) {
            fetchPosts(currentLocality.id);
        }
    }, [currentLocality]);

    const goToSocial = () => {
        router.push('/(tabs)/social' as any);
    };

    const latestPost = posts.length > 0 ? posts[0] : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>En la comunidad 💬</Text>
                <TouchableOpacity onPress={goToSocial}>
                    <Text style={[styles.seeAll, { color: tc.primary }]}>Ver más</Text>
                </TouchableOpacity>
            </View>

            {latestPost ? (
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                    activeOpacity={0.9}
                    onPress={goToSocial}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.avatarRow}>
                            <Image source={{ uri: latestPost.author.avatar_url || 'https://via.placeholder.com/40' }} style={[styles.avatar, { backgroundColor: tc.bgInput }]} />
                            <View>
                                <Text style={[styles.username, { color: tc.text }]}>{latestPost.author.full_name}</Text>
                                <Text style={[styles.time, { color: tc.textMuted }]}>{formatDistanceToNow(new Date(latestPost.created_at), { addSuffix: true, locale: es })}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.content, { color: tc.textSecondary }]} numberOfLines={2}>
                        {latestPost.content}
                    </Text>

                    {latestPost.media_urls && latestPost.media_urls.length > 0 && (
                        <Image source={{ uri: latestPost.media_urls[0] }} style={styles.postImage} />
                    )}

                    <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                        <View style={styles.stat}>
                            <Heart size={16} color={tc.textMuted} />
                            <Text style={[styles.statText, { color: tc.textSecondary }]}>{latestPost.likes_count}</Text>
                        </View>
                        <View style={styles.stat}>
                            <MessageCircle size={16} color={tc.textMuted} />
                            <Text style={[styles.statText, { color: tc.textSecondary }]}>{latestPost.comments_count} comentario{latestPost.comments_count !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.ctaCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                    activeOpacity={0.9}
                    onPress={goToSocial}
                >
                    <PenLine size={28} color={colors.primary.DEFAULT} />
                    <Text style={[styles.ctaTitle, { color: tc.text }]}>¡Sé el primero en publicar!</Text>
                    <Text style={[styles.ctaSubtitle, { color: tc.textMuted }]}>Compartí algo con tu comunidad</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 32, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700' },
    seeAll: { fontSize: 14, fontWeight: '600' },
    card: {
        borderRadius: 16, padding: 16, borderWidth: 1,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    username: { fontWeight: '600', fontSize: 14 },
    time: { fontSize: 12 },
    content: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    postImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
    footer: { flexDirection: 'row', gap: 16, borderTopWidth: 1, paddingTop: 12 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12 },
    ctaCard: {
        borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 8,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
    },
    ctaTitle: { fontSize: 16, fontWeight: '700' },
    ctaSubtitle: { fontSize: 13 },
});

