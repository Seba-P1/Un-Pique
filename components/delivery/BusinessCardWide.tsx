import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Bike, MapPin, Heart, Share2 } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Business } from '../../stores/businessStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { checkIsBusinessOpen } from '../../utils/schedule';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocialStore } from '../../stores/socialStore';
import { useLocationStore } from '../../stores/locationStore';
import { supabase } from '../../lib/supabase';
import { showAlert } from '../../utils/alert';

const CATEGORY_MAP: Record<string, string> = {
    restaurant: 'Restaurante',
    cafe: 'Café',
    bakery: 'Panadería',
    pharmacy: 'Farmacia',
    supermarket: 'Supermercado',
    minimarket: 'Minimercado',
    clothing: 'Ropa',
    shoes: 'Calzado',
    electronics: 'Electrónica',
    furniture: 'Muebles',
    beauty_salon: 'Salón de Belleza',
    barbershop: 'Barbería',
    spa: 'Spa',
    gym: 'Gimnasio',
    auto_repair: 'Mecánica',
    auto_parts: 'Repuestos',
    health_clinic: 'Clínica',
    dentist: 'Odontología',
    veterinary: 'Veterinaria',
    laundry: 'Lavandería',
    hardware_store: 'Ferretería',
    bookstore: 'Librería',
    toys: 'Juguetería',
    pets: 'Mascotas',
    services: 'Servicios',
    other: 'Otros',
};

interface BusinessCardWideProps {
    business: Business;
}

export function BusinessCardWide({ business }: BusinessCardWideProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const scale = useRef(new Animated.Value(1)).current;

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareComment, setShareComment] = useState('');
    const [sharing, setSharing] = useState(false);

    const submitShare = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showAlert('Iniciá sesión', 'Necesitás estar logueado para compartir');
                return;
            }
            setSharing(true);
            const localityId = useLocationStore.getState().currentLocality?.id;
            if (!localityId) {
                showAlert('Error', 'No se pudo determinar tu localidad.');
                setSharing(false);
                return;
            }
            const postContent = shareComment
                ? shareComment + '\n\n[business:' + business.id + ':' + business.name + ']'
                : '[business:' + business.id + ':' + business.name + ']';

            await useSocialStore.getState().createPost(
                postContent.trim(), [], localityId
            );
            showAlert('¡Listo!', 'El local fue compartido en tu muro');
            setShareModalVisible(false);
            setShareComment('');
        } catch (err: any) {
            showAlert('Error', 'No se pudo compartir: ' + (err?.message || ''));
        } finally {
            setSharing(false);
        }
    };

    const primaryColor = colors?.primary?.DEFAULT || '#FF6B35';
    const isOpen = business.is_open && checkIsBusinessOpen(business.schedule);
    const coverUri = business.cover_url || (business as any).image;
    const logoUri = business.logo_url;
    const mappedCategory = CATEGORY_MAP[business.category] || business.category || 'Otros';
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const liked = useFavoritesStore((s) => s.isFavorite('business', business.id));

    const handlePress = () => {
        router.push(`/shop/${business.slug || business.id}` as any);
    };

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: Platform.OS !== 'web' }).start();
    };

    return (
        <>
            <Pressable
                onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.pressable}
        >
            <Animated.View style={[
                styles.card,
                {
                    backgroundColor: tc.bgCard,
                    borderColor: tc.borderLight,
                    transform: [{ scale }],
                    ...(Platform.OS === 'web'
                        ? { boxShadow: '0px 3px 12px rgba(0,0,0,0.12)' }
                        : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 }
                    ),
                },
            ]}>
                {/* Banner / Cover */}
                <View style={styles.bannerContainer}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                        <LinearGradient
                            colors={['#FF6B35', '#cc4400']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bannerImage}
                        />
                    )}

                    {/* Status badge */}
                    <View style={isOpen ? styles.openBadge : styles.closedBadge}>
                        <Text style={isOpen ? styles.openText : styles.closedText}>
                            {isOpen ? 'Abierto' : 'Cerrado'}
                        </Text>
                    </View>

                    {/* Favorite button top-right */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.favoriteButton,
                            pressed && { transform: [{ scale: 0.9 }] }
                        ]}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        onPress={(e) => {
                            e.stopPropagation?.();
                            toggleFavorite('business', business.id);
                        }}
                    >
                        <Heart
                            size={16}
                            color={liked ? '#ef4444' : '#ffffff'}
                            fill={liked ? '#ef4444' : 'transparent'}
                        />
                    </Pressable>

                    {/* Share button below favorite */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.shareCircle,
                            pressed && { transform: [{ scale: 0.9 }] }
                        ]}
                        onPress={(e) => {
                            e.stopPropagation?.();
                            setShareModalVisible(true);
                        }}
                    >
                        <Share2 size={14} color="#ffffff" />
                    </Pressable>

                    {/* Logo superpuesto en bottom-left */}
                    <View style={[styles.logoWrap, { backgroundColor: tc.bgCard }]}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.logoImg} resizeMode="cover" />
                        ) : (
                            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
                                <Text style={styles.logoInitial}>
                                    {business.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info */}
                <View style={styles.content}>
                    <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
                        {business.name}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={[styles.category, { color: tc.textSecondary }]} numberOfLines={1}>
                            {mappedCategory}
                        </Text>

                        {business.has_delivery && (
                            <>
                                <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                                <View style={styles.deliveryBadge}>
                                    <Bike size={11} color="#22c55e" />
                                    <Text style={[styles.deliveryText, { color: tc.textSecondary }]}>
                                        {business.delivery_fee === 0
                                            ? 'Envío gratis'
                                            : `Envío $${business.delivery_fee}`}
                                    </Text>
                                </View>
                            </>
                        )}

                        {!business.has_delivery && business.has_pickup && (
                            <>
                                <Text style={[styles.dot, { color: tc.textMuted }]}>·</Text>
                                <View style={styles.deliveryBadge}>
                                    <MapPin size={11} color={tc.textMuted} />
                                    <Text style={[styles.deliveryText, { color: tc.textSecondary }]}>
                                        Retiro en local
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {typeof business.rating === 'number' && business.rating > 0 && (
                        <View style={[styles.ratingBadge, { backgroundColor: primaryColor }]}>
                            <Text style={styles.ratingText}>⭐ {business.rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </Pressable>

        <Modal visible={shareModalVisible} transparent animationType="fade">
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
                alignItems: 'center',
                paddingHorizontal: Platform.OS === 'web' ? 20 : 0,
                paddingVertical: Platform.OS === 'web' ? 20 : 0,
            }}>
                <View style={{
                    width: '100%',
                    maxWidth: 440,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    borderRadius: Platform.OS === 'web' ? 20 : 0,
                    padding: 24,
                    paddingBottom: Platform.OS === 'web' ? 24 : 40,
                    backgroundColor: tc.bgCard,
                }}>
                        <Text style={{
                            fontSize: 18, fontWeight: '700',
                            marginBottom: 16, textAlign: 'center',
                            color: tc.text,
                        }}>
                            Compartir en tu muro
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 14,
                                padding: 14,
                                minHeight: 80,
                                textAlignVertical: 'top',
                                fontSize: 15,
                                marginBottom: 16,
                                borderColor: tc.borderLight,
                                color: tc.text,
                                backgroundColor: tc.bg,
                            }}
                            placeholder="Agregá un comentario (opcional)..."
                            placeholderTextColor={tc.textMuted}
                            value={shareComment}
                            onChangeText={setShareComment}
                            multiline
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Pressable
                                style={{
                                    flex: 1, padding: 14, borderRadius: 14,
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1, borderColor: tc.borderLight,
                                }}
                                onPress={() => {
                                    setShareModalVisible(false);
                                    setShareComment('');
                                }}
                                disabled={sharing}
                            >
                                <Text style={{ color: tc.text, fontWeight: '600' }}>
                                    Cancelar
                                </Text>
                            </Pressable>
                            <Pressable
                                style={{
                                    flex: 1, padding: 14, borderRadius: 14,
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: '#FF6B35',
                                }}
                                onPress={submitShare}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 8
                                    }}>
                                        <Share2 size={16} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                            Publicar
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        </View>
                    </View>
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    pressable: {
        width: 280,
        marginRight: 14,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    bannerContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    openBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        zIndex: 2,
    },
    openText: {
        color: '#4ade80',
        fontSize: 10,
        fontWeight: '700',
    },
    closedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#3a1a1a',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        zIndex: 2,
    },
    closedText: {
        color: '#f87171',
        fontSize: 10,
        fontWeight: '700',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    shareCircle: {
        position: 'absolute',
        top: 46, // 8 + 30 + 8
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    logoWrap: {
        position: 'absolute',
        bottom: -20,
        left: 12,
        width: 56,
        height: 56,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    logoImg: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInitial: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 28, // espacio para el logo superpuesto
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    category: {
        fontSize: 13,
    },
    dot: {
        fontSize: 13,
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    deliveryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    ratingBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    ratingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
