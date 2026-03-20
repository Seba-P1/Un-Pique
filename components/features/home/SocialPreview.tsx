import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MessageCircle, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const PREVIEW_POST = {
    user: 'Ana García',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    content: '¡Increíble la feria de emprendedores de este fin de semana! 👏 #Florida',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    likes: 24,
    comments: 5
};

export const SocialPreview = () => {
    const tc = useThemeColors();
    const router = useRouter();

    const goToSocial = () => {
        router.push('/(tabs)/social' as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>En la comunidad 💬</Text>
                <TouchableOpacity onPress={goToSocial}>
                    <Text style={[styles.seeAll, { color: tc.primary }]}>Ver más</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                activeOpacity={0.9}
                onPress={goToSocial}
            >
                <View style={styles.cardHeader}>
                    <TouchableOpacity style={styles.avatarRow} onPress={goToSocial}>
                        <Image source={{ uri: PREVIEW_POST.avatar }} style={[styles.avatar, { backgroundColor: tc.bgInput }]} />
                        <View>
                            <Text style={[styles.username, { color: tc.text }]}>{PREVIEW_POST.user}</Text>
                            <Text style={[styles.time, { color: tc.textMuted }]}>Hace 2h</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.content, { color: tc.textSecondary }]} numberOfLines={2}>
                    {PREVIEW_POST.content}
                </Text>

                {PREVIEW_POST.image && (
                    <Image source={{ uri: PREVIEW_POST.image }} style={styles.postImage} />
                )}

                <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                    <View style={styles.stat}>
                        <Heart size={16} color={tc.textMuted} />
                        <Text style={[styles.statText, { color: tc.textSecondary }]}>{PREVIEW_POST.likes}</Text>
                    </View>
                    <View style={styles.stat}>
                        <MessageCircle size={16} color={tc.textMuted} />
                        <Text style={[styles.statText, { color: tc.textSecondary }]}>{PREVIEW_POST.comments} comentarios</Text>
                    </View>
                </View>
            </TouchableOpacity>
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
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */    
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
});
