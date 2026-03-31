import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Star, MessageCircle, Share2, Clock, Globe, ArrowLeft, AlertTriangle } from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { Button } from '../../components/ui';
import { useThemeColors } from '../../hooks/useThemeColors';
import { supabase } from '../../lib/supabase';
import type { Listing } from '../../stores/listingStore';

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchListing();
    }, [id]);

    const fetchListing = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setListing(data as Listing);
        } catch (err) {
            console.error('Error fetching listing:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: tc.bg }]}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
        );
    }

    if (!listing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: tc.bg }]}>
                <AlertTriangle size={40} color={tc.textMuted} />
                <Text style={[styles.errorText, { color: tc.textMuted }]}>Publicación no encontrada</Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backLinkBtn, { borderColor: tc.borderLight }]}>
                    <Text style={{ color: tc.primary, fontWeight: '600' }}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleCall = () => {
        if (!listing.phone) return showAlert('Sin teléfono', 'Este servicio no tiene teléfono registrado.');
        Linking.openURL(`tel:${listing.phone}`).catch(() => showAlert('Error', 'No se pudo abrir el teléfono.'));
    };

    const handleWhatsApp = () => {
        if (!listing.phone) return showAlert('Sin teléfono', 'Este servicio no tiene WhatsApp registrado.');
        const cleanPhone = listing.phone.replace(/[^0-9+]/g, '');
        Linking.openURL(`https://wa.me/${cleanPhone}`);
    };

    const handleShare = async () => {
        try {
            const message = `${listing.title} — ${listing.description}\n\nCompartido desde Un Pique`;
            if (Platform.OS === 'web' && navigator.share) {
                await navigator.share({ text: message });
            } else if (Platform.OS !== 'web') {
                await Share.share({ message });
            } else {
                await navigator.clipboard.writeText(message);
                showAlert('Copiado', 'Enlace copiado al portapapeles.');
            }
        } catch (e) { /* user cancelled */ }
    };

    const coverImage = listing.images?.[0] || 'https://via.placeholder.com/800x200?text=Sin+imagen';

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Back button overlay */}
                <TouchableOpacity 
                    style={[styles.backBtnOverlay, { backgroundColor: tc.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]} 
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={20} color={tc.text} />
                </TouchableOpacity>

                <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />

                <View style={[styles.contentContainer, { backgroundColor: tc.bg }]}>
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={[styles.name, { color: tc.text }]}>{listing.title}</Text>
                            <Text style={[styles.category, { color: tc.textMuted }]}>{listing.category || listing.accommodation_type || ''}</Text>
                            <View style={styles.ratingRow}>
                                <Star size={14} color={colors.warning} fill={colors.warning} />
                                <Text style={[styles.rating, { color: tc.textSecondary }]}>
                                    {listing.rating?.toFixed(1) || '0.0'} ({listing.reviews_count || 0} opiniones)
                                </Text>
                            </View>
                        </View>
                    </View>

                    {listing.description ? (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Sobre Nosotros</Text>
                            <Text style={[styles.description, { color: tc.textSecondary }]}>{listing.description}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.infoCard, {
                        backgroundColor: tc.bgCard,
                        ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.06)' } : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: tc.isDark ? 0.3 : 0.05, shadowRadius: 8 }),
                    }]}>
                        {listing.address ? (
                            <>
                                <View style={styles.infoRow}>
                                    <MapPin size={20} color={tc.primary} />
                                    <Text style={[styles.infoText, { color: tc.text }]}>{listing.address}</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                            </>
                        ) : null}
                        {listing.phone ? (
                            <>
                                <View style={styles.infoRow}>
                                    <Phone size={20} color={tc.primary} />
                                    <Text style={[styles.infoText, { color: tc.text }]}>{listing.phone}</Text>
                                </View>
                                <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                            </>
                        ) : null}
                        {listing.hourly_rate ? (
                            <View style={styles.infoRow}>
                                <Clock size={20} color={tc.primary} />
                                <Text style={[styles.infoText, { color: tc.text }]}>${listing.hourly_rate}/hr</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Gallery of additional images */}
                    {listing.images && listing.images.length > 1 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Galería</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {listing.images.map((img, i) => (
                                    <Image key={i} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={handleShare}>
                            <Share2 size={24} color={tc.textSecondary} />
                            <Text style={[styles.actionBtnTextSec, { color: tc.textSecondary }]}>Compartir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => showAlert('Próximamente', 'Podrás guardar servicios a favoritos.')}>
                            <Star size={24} color={tc.textSecondary} />
                            <Text style={[styles.actionBtnTextSec, { color: tc.textSecondary }]}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <View style={styles.footerRow}>
                    <TouchableOpacity style={[styles.callButton, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]} onPress={handleCall}>
                        <Phone size={20} color={tc.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Button
                            title="Enviar WhatsApp"
                            icon={<MessageCircle size={18} color="white" />}
                            onPress={handleWhatsApp}
                            style={{ height: 46 }}
                            textStyle={{ fontSize: 15 }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    coverImage: { width: '100%', height: 200 },
    backBtnOverlay: {
        position: 'absolute', top: 48, left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    contentContainer: {
        flex: 1, marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 20, paddingTop: 32,
    },
    header: { flexDirection: 'row', marginBottom: 24 },
    headerText: { flex: 1 },
    name: { fontSize: 22, fontWeight: '700' },
    category: { fontSize: 14, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { fontSize: 13, fontWeight: '500' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    description: { fontSize: 15, lineHeight: 22 },
    infoCard: { borderRadius: 16, padding: 16, marginBottom: 24 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    infoText: { fontSize: 15, flex: 1 },
    divider: { height: 1 },
    actionsGrid: { flexDirection: 'row', gap: 12 },
    actionBtnSecondary: {
        flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center', borderWidth: 1, gap: 6,
    },
    actionBtnTextSec: { fontSize: 13, fontWeight: '600' },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
    },
    footerRow: { flexDirection: 'row', gap: 12 },
    callButton: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    },
    errorText: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    galleryImage: { width: 140, height: 100, borderRadius: 12 },
});

