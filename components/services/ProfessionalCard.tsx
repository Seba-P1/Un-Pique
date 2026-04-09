import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Star, MapPin, Heart, Share2 } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useLocationStore } from '../../stores/locationStore';
import { useSocialStore } from '../../stores/socialStore';

interface Professional {
    id: string;
    full_name: string;
    avatar_url: string;
    specialty: string;
    rating: number;
    reviews_count: number;
    location?: string;
    hourly_rate?: number;
    description?: string;
}

interface ProfessionalCardProps {
    professional: Professional;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
    const router = useRouter();
    const tc = useThemeColors();
    const { user } = useAuthStore();
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const [sharing, setSharing] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareComment, setShareComment] = useState('');

    const isSaved = isFavorite('listing', professional.id);

    const handleShare = async () => {
        if (!user) {
            Alert.alert('Iniciá sesión', 'Necesitás estar logueado para compartir');
            return;
        }
        setShareModalVisible(true);
    };

    const submitShare = async () => {
        try {
            if (!user) return;

            setSharing(true);
            const localityId = useLocationStore.getState().currentLocality?.id;
            if (!localityId) {
                Alert.alert('Error', 'No se pudo determinar tu localidad. Reabrí la app.');
                setSharing(false);
                return;
            }
            const serviceName = professional.full_name || 'Servicio';
            
            const postContent = shareComment 
                ? shareComment + '\n\n[service:' + professional.id + ':' + serviceName + ']'
                : '[service:' + professional.id + ':' + serviceName + ']';

            await useSocialStore.getState().createPost(postContent.trim(), [], localityId);

            Alert.alert('¡Listo!', 'El servicio fue compartido en tu muro');
            setShareModalVisible(false);
            setShareComment('');
        } catch (err: any) {
            console.error('[Share service] Error real:', JSON.stringify(err));
            Alert.alert('Error', 'No se pudo compartir: ' + (err?.message || JSON.stringify(err)));
        } finally {
            setSharing(false);
        }
    };

    const handlePress = () => {
        router.push(`/directory/${professional.id}` as any);
    };

    return (
        <View
            style={[styles.cardContainer, {
                backgroundColor: tc.bgCard,
                ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0px 2px 8px rgba(0,0,0,0.3)' : '0px 4px 12px rgba(0,0,0,0.08)' } : {}),
            }]}
        >
            <TouchableOpacity style={styles.cardMain} onPress={handlePress} activeOpacity={0.7}>
                <View style={styles.cardTopRow}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: professional.avatar_url || 'https://via.placeholder.com/150' }}
                            style={[styles.image, { backgroundColor: tc.bgInput }]}
                            resizeMode="cover"
                        />
                        <View style={[styles.ratingBadge, { backgroundColor: tc.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)' }]}>
                            <Star size={12} color={colors.warning} fill={colors.warning} />
                            <Text style={[styles.ratingText, { color: tc.text }]}>
                                {professional.rating?.toFixed(1) || 'Nuevo'}
                                {professional.reviews_count > 0 && ` (${professional.reviews_count})`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={[styles.specialty, { color: tc.primary }]}>{professional.specialty || 'Profesional'}</Text>
                        <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>{professional.full_name}</Text>

                        {professional.location && (
                            <View style={styles.infoRow}>
                                <MapPin size={14} color={tc.textMuted} />
                                <Text style={[styles.infoText, { color: tc.textMuted }]} numberOfLines={1}>{professional.location}</Text>
                            </View>
                        )}

                        {professional.description && (
                            <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>
                                {professional.description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Precio Section */}
                <View style={styles.cardPriceRow}>
                    {professional.hourly_rate ? (
                        <Text style={[styles.price, { color: tc.text }]}>
                            ${professional.hourly_rate}
                            <Text style={[styles.priceUnit, { color: tc.textMuted }]}> / hr</Text>
                        </Text>
                    ) : (
                        <Text style={[styles.consultText, { color: tc.textMuted }]}>Consultar precio</Text>
                    )}
                </View>

                {/* Ver Perfil Button Full Width */}
                <View style={[styles.bookButtonFull, { backgroundColor: tc.bgInput }]}>
                    <Text style={[styles.bookButtonText, { color: tc.text }]}>Ver perfil</Text>
                </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: 'rgba(128,128,128,0.12)' }]} />
            <View style={styles.actionsRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: tc.bgHover }]} 
                    onPress={() => toggleFavorite('listing', professional.id)}
                >
                    <Heart size={15} color={isSaved ? '#ef4444' : tc.textMuted} fill={isSaved ? '#ef4444' : 'transparent'} />
                    <Text style={[styles.actionBtnText, { color: tc.text }]}>{isSaved ? 'Guardado' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: tc.bgHover, opacity: sharing ? 0.5 : 1 }]} 
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Share2 size={15} color={tc.textMuted} />
                    <Text style={[styles.actionBtnText, { color: tc.text }]}>Compartir</Text>
                </TouchableOpacity>
            </View>

            {/* Share Modal */}
            <Modal visible={shareModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: tc.bgCard }]}>
                        <Text style={[styles.modalTitle, { color: tc.text }]}>Compartir en tu muro</Text>
                        <TextInput
                            style={[styles.modalInput, { borderColor: tc.borderLight, color: tc.text, backgroundColor: tc.bg }]}
                            placeholder="Agregá un comentario (opcional)..."
                            placeholderTextColor={tc.textMuted}
                            value={shareComment}
                            onChangeText={setShareComment}
                            multiline
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: tc.borderLight }]} 
                                onPress={() => setShareModalVisible(false)}
                                disabled={sharing}
                            >
                                <Text style={{ color: tc.text, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnSubmit]} 
                                onPress={submitShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={styles.modalBtnTextContainer}>
                                        <Share2 size={16} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Publicar</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'column',
    },
    cardTopRow: {
        flexDirection: 'row',
        padding: 12,
        paddingBottom: 8,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    specialty: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        flex: 1,
    },
    description: {
        fontSize: 12,
        marginBottom: 4,
        lineHeight: 16,
    },
    cardPriceRow: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        flexDirection: 'row',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    priceUnit: {
        fontSize: 12,
        fontWeight: '400',
    },
    consultText: {
        fontSize: 13,
        fontWeight: '500',
    },
    bookButtonFull: {
        marginHorizontal: 12,
        marginBottom: 12,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 12,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, marginBottom: 16 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: 'transparent', borderWidth: 1 },
    modalBtnSubmit: { backgroundColor: '#FF6B35' },
    modalBtnTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 }
});
