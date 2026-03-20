import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Phone, Star, MessageCircle, Share2, Clock, Globe } from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { Button } from '../../components/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const tc = useThemeColors();

    const SERVICE = {
        id: id,
        name: 'Plomería García',
        category: 'Plomería',
        rating: 4.8,
        reviews: 24,
        address: 'Calle 12, Nro 450, Río Colorado',
        phone: '291-1234567',
        whatsapp: '5492911234567',
        avatar: 'https://images.unsplash.com/photo-1581578731117-104529302f28?q=80&w=400',
        cover: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=800',
        description: 'Somos expertos en soluciones hidráulicas. Realizamos reparaciones urgentes, destapes, instalaciones de grifería y mantenimiento general de cañerías. Atención las 24hs para emergencias.',
        hours: 'Lun a Vie: 08:00 - 20:00',
        website: 'www.plomeriagarcia.com.ar'
    };

    const handleCall = () => {
        Linking.openURL(`tel:${SERVICE.phone}`).catch(() => showAlert('Error', 'No se pudo abrir el teléfono.'));
    };

    const handleWhatsApp = () => {
        Linking.openURL(`https://wa.me/${SERVICE.whatsapp}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Image source={{ uri: SERVICE.cover }} style={styles.coverImage} resizeMode="cover" />

                <View style={[styles.contentContainer, { backgroundColor: tc.bg }]}>
                    <View style={styles.header}>
                        <Image source={{ uri: SERVICE.avatar }} style={[styles.avatar, { borderColor: tc.bg }]} />
                        <View style={styles.headerText}>
                            <Text style={[styles.name, { color: tc.text }]}>{SERVICE.name}</Text>
                            <Text style={[styles.category, { color: tc.textMuted }]}>{SERVICE.category}</Text>
                            <View style={styles.ratingRow}>
                                <Star size={14} color={colors.warning} fill={colors.warning} />
                                <Text style={[styles.rating, { color: tc.textSecondary }]}>{SERVICE.rating} ({SERVICE.reviews} opiniones)</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: tc.text }]}>Sobre Nosotros</Text>
                        <Text style={[styles.description, { color: tc.textSecondary }]}>{SERVICE.description}</Text>
                    </View>

                    <View style={[styles.infoCard, {
                        backgroundColor: tc.bgCard,
                        ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.06)' } : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: tc.isDark ? 0.3 : 0.05, shadowRadius: 8 }),
                    }]}>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={tc.primary} />
                            <Text style={[styles.infoText, { color: tc.text }]}>{SERVICE.address}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                        <View style={styles.infoRow}>
                            <Clock size={20} color={tc.primary} />
                            <Text style={[styles.infoText, { color: tc.text }]}>{SERVICE.hours}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                        <View style={styles.infoRow}>
                            <Globe size={20} color={tc.primary} />
                            <Text style={[styles.infoText, { color: tc.text }]}>{SERVICE.website}</Text>
                        </View>
                    </View>

                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => showAlert('Compartir', 'Función disponible próximamente')}>
                            <Share2 size={24} color={tc.textSecondary} />
                            <Text style={[styles.actionBtnTextSec, { color: tc.textSecondary }]}>Compartir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => showAlert('Guardado', 'Servicio guardado en favoritos')}>
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
    coverImage: { width: '100%', height: 200 },
    contentContainer: {
        flex: 1, marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 20, paddingTop: 32,
    },
    header: { flexDirection: 'row', marginBottom: 24 },
    avatar: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 4,
        marginTop: -40, marginRight: 16,
    },
    headerText: { flex: 1 },
    name: { fontFamily: 'Nunito Sans', fontSize: 22, fontWeight: '700' },
    category: { fontFamily: 'Nunito Sans', fontSize: 14, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { fontFamily: 'Nunito Sans', fontSize: 13, fontWeight: '500' },
    section: { marginBottom: 24 },
    sectionTitle: { fontFamily: 'Nunito Sans', fontSize: 18, fontWeight: '600', marginBottom: 8 },
    description: { fontFamily: 'Nunito Sans', fontSize: 15, lineHeight: 22 },
    infoCard: { borderRadius: 16, padding: 16, marginBottom: 24 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    infoText: { fontFamily: 'Nunito Sans', fontSize: 15, flex: 1 },
    divider: { height: 1 },
    actionsGrid: { flexDirection: 'row', gap: 12 },
    actionBtnSecondary: {
        flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center', borderWidth: 1, gap: 6,
    },
    actionBtnTextSec: { fontFamily: 'Nunito Sans', fontSize: 13, fontWeight: '600' },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
    },
    footerRow: { flexDirection: 'row', gap: 12 },
    callButton: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    },
});
