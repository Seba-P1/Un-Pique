// Alojamiento — Responsive: Desktop horizontal cards + sidebar, Mobile vertical cards
// Photo gallery modal, bigger calendar modal, functional WhatsApp/email/phone via Linking
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
    useWindowDimensions, Modal, TextInput, Linking, Platform, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import {
    Star, MapPin, Calendar, X, Mail, Phone, ChevronLeft, ChevronRight,
    Wifi, Car, Coffee, Tv, Snowflake, Users, MessageCircle, Home,
    UtensilsCrossed, Wrench, User, Settings, HelpCircle, LogOut, Moon, Sun,
    ShoppingBag, ZoomIn, ImageIcon, Plus
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import colors from '../constants/colors';
import { showAlert } from '../utils/alert';
import { useListingStore } from '../stores/listingStore';
import type { Listing } from '../stores/listingStore';
import { AppHeader } from '../components/ui/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const renderIcon = (Icon: any, size: number, color: string) => <Icon size={size} color={color} />;

// ── NAV DATA (mirrors tabs layout) ──
const NAV_ITEMS = [
    { key: 'index', label: 'Inicio', icon: Home, route: '/' },
    { key: 'marketplace', label: 'Sabor Local', icon: UtensilsCrossed, route: '/(tabs)/marketplace' },
    { key: 'servicios', label: 'Servicios', icon: Wrench, route: '/(tabs)/servicios' },
    { key: 'social', label: 'Social', icon: MessageCircle, route: '/(tabs)/social' },
    { key: 'profile', label: 'Mi Perfil', icon: User, route: '/(tabs)/profile' },
];
const EXTRA_ITEMS = [
    { key: 'orders', label: 'Mis Pedidos', icon: ShoppingBag, route: '/orders' },
    { key: 'addresses', label: 'Mis Direcciones', icon: MapPin, route: '/addresses' },
    { key: 'alojamiento', label: 'Alojamientos', icon: Home, route: '/alojamiento' },
    { key: 'settings', label: 'Configuración', icon: Settings, route: '/settings' },
    { key: 'help', label: 'Ayuda', icon: HelpCircle, route: '/help' },
];

// ── MOCK ACCOMMODATIONS ──
const MOCK_ACCOMMODATIONS = [
    {
        id: '1', name: 'Hotel Paraíso', type: 'Hotel',
        images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
        ],
        rating: 4.8, reviews: 124,
        address: 'Av. San Martín 1200',
        description: 'Hotel 4 estrellas con piscina climatizada, spa completo, buffet desayuno, y vista panorámica al río. Habitaciones amplias con balcón privado y Wi-Fi de alta velocidad.',
        amenities: ['Wifi', 'Estacionamiento', 'Desayuno', 'TV', 'A/C', 'Pileta'],
        phone: '+5493821555555', email: 'reservas@hotelparaiso.com',
        checkIn: '14:00', checkOut: '10:00', guests: '1-4 personas',
    },
    {
        id: '2', name: 'Cabaña del Bosque', type: 'Cabaña',
        images: [
            'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
            'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80',
            'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80',
        ],
        rating: 4.9, reviews: 89,
        address: 'Ruta 38, Km 15',
        description: 'Cabaña rústica premium para 4 personas rodeada de naturaleza. Chimenea, deck con parrilla, y senderos privados. Ideal para desconectar.',
        amenities: ['Wifi', 'Estacionamiento', 'Parrilla', 'A/C'],
        phone: '+5493821666666', email: 'info@cabaniabosque.com',
        checkIn: '15:00', checkOut: '11:00', guests: '2-4 personas',
    },
    {
        id: '3', name: 'Hostel Backpackers', type: 'Hostel',
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
            'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&q=80',
        ],
        rating: 4.3, reviews: 215,
        address: 'Calle Belgrano 450',
        description: 'Hostel económico con ambiente joven y social. Habitaciones compartidas y privadas, cocina compartida, terraza con vista, y actividades grupales.',
        amenities: ['Wifi', 'Desayuno', 'Cocina'],
        phone: '+5493821777777', email: 'hello@backpackers.com',
        checkIn: '13:00', checkOut: '10:00', guests: '1-8 personas',
    },
    {
        id: '4', name: 'Apart Hotel Río', type: 'Apart Hotel',
        images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        ],
        rating: 4.6, reviews: 67,
        address: 'Costanera Norte 800',
        description: 'Departamentos temporarios full-equipped con vista al río. Cocina completa, living, dormitorio, y servicios de hotel incluidos.',
        amenities: ['Wifi', 'Estacionamiento', 'Cocina', 'TV', 'A/C', 'Pileta'],
        phone: '+5493821888888', email: 'reservas@apartrio.com',
        checkIn: '14:00', checkOut: '10:00', guests: '1-6 personas',
    },
];

type Accom = typeof MOCK_ACCOMMODATIONS[0];

const AMENITY_ICONS: Record<string, any> = {
    'Wifi': Wifi, 'Estacionamiento': Car, 'Desayuno': Coffee, 'TV': Tv,
    'A/C': Snowflake, 'Pileta': Users, 'Parrilla': Coffee, 'Cocina': Coffee,
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

// ── CALENDAR ──
function CalendarPicker({ selectedDates, onSelect, tc }: { selectedDates: Date[]; onSelect: (d: Date) => void; tc: any }) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isSelected = (d: number) => selectedDates.some(sd => sd.getDate() === d && sd.getMonth() === month && sd.getFullYear() === year);
    const isPast = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isInRange = (d: number) => {
        if (selectedDates.length !== 2) return false;
        const curr = new Date(year, month, d).getTime();
        return curr > selectedDates[0].getTime() && curr < selectedDates[1].getTime();
    };

    return (
        <View style={calStyles.container}>
            <View style={calStyles.header}>
                <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={calStyles.navBtn}>
                    <ChevronLeft size={22} color={tc.text} />
                </TouchableOpacity>
                <Text style={[calStyles.title, { color: tc.text }]}>{MONTHS[month]} {year}</Text>
                <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={calStyles.navBtn}>
                    <ChevronRight size={22} color={tc.text} />
                </TouchableOpacity>
            </View>
            <View style={calStyles.daysRow}>
                {DAYS.map(d => <Text key={d} style={[calStyles.dayLabel, { color: tc.textMuted }]}>{d}</Text>)}
            </View>
            <View style={calStyles.grid}>
                {cells.map((day, idx) => {
                    const selected = day ? isSelected(day) : false;
                    const range = day ? isInRange(day) : false;
                    const past = day ? isPast(day) : false;
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                calStyles.cell,
                                selected && { backgroundColor: colors.primary.DEFAULT, borderRadius: 22 },
                                range && { backgroundColor: colors.primary.DEFAULT + '25' },
                            ]}
                            disabled={!day || past}
                            onPress={() => day && onSelect(new Date(year, month, day))}
                        >
                            {day ? (
                                <Text style={[calStyles.cellText, { color: past ? tc.textMuted + '60' : selected ? '#fff' : tc.text }]}>{day}</Text>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>
            {selectedDates.length > 0 && (
                <View style={[calStyles.summary, { backgroundColor: colors.primary.DEFAULT + '12' }]}>
                    <Calendar size={16} color={colors.primary.DEFAULT} />
                    <Text style={[calStyles.summaryText, { color: colors.primary.DEFAULT }]}>
                        {selectedDates.length === 1
                            ? `Check-in: ${selectedDates[0].getDate()}/${selectedDates[0].getMonth() + 1}/${selectedDates[0].getFullYear()}`
                            : `${selectedDates[0].getDate()}/${selectedDates[0].getMonth() + 1} → ${selectedDates[1].getDate()}/${selectedDates[1].getMonth() + 1}/${selectedDates[1].getFullYear()} (${Math.ceil((selectedDates[1].getTime() - selectedDates[0].getTime()) / 86400000)} noches)`
                        }
                    </Text>
                </View>
            )}
        </View>
    );
}

const calStyles = StyleSheet.create({
    container: { marginBottom: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    navBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '700' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    dayLabel: { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%', height: 44, justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 15, fontWeight: '500' },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginTop: 12 },
    summaryText: { fontSize: 14, fontWeight: '700' },
});


// ── CONTACT HELPERS (functional!) ──
function openWhatsApp(phone: string, message: string) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => showAlert('Error', 'No se pudo abrir WhatsApp.'));
}
function openEmail(email: string, subject: string, body: string) {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url).catch(() => showAlert('Error', 'No se pudo abrir el correo.'));
}
function openPhone(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => showAlert('Error', 'No se pudo abrir el teléfono.'));
}

// ════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════
export default function AlojamientoScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const isLargeDesktop = width >= 1100;
    const { user } = useAuthStore();

    // Datos reales de Supabase
    const { accommodations, fetchAccommodations } = useListingStore();

    useEffect(() => { fetchAccommodations(); }, []);

    // Mapear listings de Supabase al formato Accom, con mock como fallback
    const displayData = useMemo(() => {
        if (accommodations.length > 0) {
            return accommodations.map((l: Listing): Accom => ({
                id: l.id,
                name: l.title,
                type: l.accommodation_type || l.category || 'Otro',
                images: l.images.length > 0 ? l.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
                rating: l.rating,
                reviews: l.reviews_count,
                address: l.address || '',
                description: l.description,
                amenities: l.amenities,
                phone: l.phone,
                email: l.email || '',
                checkIn: l.check_in || '14:00',
                checkOut: l.check_out || '10:00',
                guests: l.max_guests ? `1-${l.max_guests} personas` : 'Consultar',
            }));
        }
        return MOCK_ACCOMMODATIONS;
    }, [accommodations]);

    const handlePublishAccommodation = () => {
        if (!user) {
            showAlert('Iniciá sesión', 'Necesitás una cuenta para publicar tu alojamiento.');
            return;
        }
        router.push('/publish/accommodation' as any);
    };

    // Selection & modals
    const [selectedAccom, setSelectedAccom] = useState<Accom | null>(null);
    const [calendarModal, setCalendarModal] = useState(false);
    const [galleryModal, setGalleryModal] = useState(false);
    const [galleryIdx, setGalleryIdx] = useState(0);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [message, setMessage] = useState('');

    const handleDateSelect = (d: Date) => {
        if (selectedDates.length === 0 || selectedDates.length === 2) {
            setSelectedDates([d]);
        } else {
            const sorted = [selectedDates[0], d].sort((a, b) => a.getTime() - b.getTime());
            setSelectedDates(sorted);
        }
    };

    const buildMessage = (accom: Accom) => {
        const datePart = selectedDates.length === 2
            ? `del ${selectedDates[0].getDate()}/${selectedDates[0].getMonth() + 1} al ${selectedDates[1].getDate()}/${selectedDates[1].getMonth() + 1}/${selectedDates[1].getFullYear()}`
            : selectedDates.length === 1
                ? `para el ${selectedDates[0].getDate()}/${selectedDates[0].getMonth() + 1}/${selectedDates[0].getFullYear()}`
                : '';
        return `Hola! Me gustaría consultar disponibilidad en ${accom.name} ${datePart}${message ? '. ' + message : ''}`.trim();
    };

    const openGallery = (accom: Accom, idx: number) => {
        setSelectedAccom(accom);
        setGalleryIdx(idx);
        setGalleryModal(true);
    };

    const openDetail = (accom: Accom) => {
        setSelectedAccom(accom);
        setSelectedDates([]);
        setMessage('');
    };

    // ── CARD RENDERER ──
    const renderCard = (accom: Accom) => {
        if (isDesktop) {
            // DESKTOP: Horizontal card — image left, info right
            return (
                <TouchableOpacity
                    key={accom.id}
                    style={[s.cardH, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                    onPress={() => openDetail(accom)}
                    activeOpacity={0.88}
                >
                    {/* Image Left */}
                    <TouchableOpacity onPress={() => openGallery(accom, 0)} activeOpacity={0.9}>
                        <Image source={{ uri: accom.images[0] }} style={s.cardHImg} />
                        <View style={s.cardHImgBadge}>
                            <ImageIcon size={12} color="#fff" />
                            <Text style={s.cardHImgCount}>{accom.images.length}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Info Right */}
                    <View style={s.cardHBody}>
                        <View style={s.cardHTopRow}>
                            <View style={[s.typeBadge, { backgroundColor: colors.primary.DEFAULT + '18' }]}>
                                <Text style={[s.typeText, { color: colors.primary.DEFAULT }]}>{accom.type}</Text>
                            </View>
                            <View style={s.ratingRow}>
                                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                <Text style={[s.ratingVal, { color: tc.text }]}>{accom.rating}</Text>
                                <Text style={[s.ratingCount, { color: tc.textMuted }]}>({accom.reviews})</Text>
                            </View>
                        </View>
                        <Text style={[s.cardHName, { color: tc.text }]}>{accom.name}</Text>
                        <View style={s.addressRow}>
                            <MapPin size={12} color={tc.textMuted} />
                            <Text style={[s.addressText, { color: tc.textMuted }]}>{accom.address}</Text>
                        </View>
                        <Text style={[s.cardHDesc, { color: tc.textSecondary }]} numberOfLines={2}>{accom.description}</Text>

                        {/* Amenities chips */}
                        <View style={s.amenitiesRow}>
                            {accom.amenities.slice(0, 5).map((a, i) => (
                                <View key={i} style={[s.amenityChip, { backgroundColor: tc.bgInput }]}>
                                    {renderIcon(AMENITY_ICONS[a] || Wifi, 12, tc.textMuted)}
                                    <Text style={[s.amenityText, { color: tc.textSecondary }]}>{a}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Quick actions row — compact buttons on desktop */}
                        <View style={s.cardActionsRow}>
                            <Text style={[s.priceConsultar, { color: tc.primary }]}>Precio: Consultar</Text>
                            <View style={s.cardQuickBtns}>
                                <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#25D366' }]} onPress={() => openWhatsApp(accom.phone, `Hola! Quisiera consultar disponibilidad en ${accom.name}`)}>
                                    <MessageCircle size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.quickBtn, { backgroundColor: colors.info }]} onPress={() => openEmail(accom.email, `Consulta - ${accom.name}`, `Hola, quisiera consultar disponibilidad.`)}>
                                    <Mail size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.quickBtn, { backgroundColor: tc.isDark ? '#444' : '#ddd' }]} onPress={() => openPhone(accom.phone)}>
                                    <Phone size={14} color={tc.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.calendarQuickBtn, { borderColor: colors.primary.DEFAULT }]}
                                    onPress={() => { setSelectedAccom(accom); setSelectedDates([]); setCalendarModal(true); }}
                                >
                                    <Calendar size={14} color={colors.primary.DEFAULT} />
                                    <Text style={[s.calendarQuickText, { color: colors.primary.DEFAULT }]}>Fechas</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // MOBILE: Vertical card
        return (
            <TouchableOpacity
                key={accom.id}
                style={[s.cardV, { backgroundColor: tc.bgCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderRadius: 12, borderWidth: 0 }]}
                onPress={() => openDetail(accom)}
                activeOpacity={0.88}
            >
                <TouchableOpacity onPress={() => openGallery(accom, 0)} activeOpacity={0.9} style={{ position: 'relative' }}>
                    <Image source={{ uri: accom.images[0] }} style={[s.cardVImg, { height: undefined, aspectRatio: 16 / 9, borderRadius: 12 }]} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', borderRadius: 12 }}
                    />
                    <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} numberOfLines={1}>{accom.name}</Text>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Consultar</Text>
                        </View>
                    </View>
                    <View style={[s.cardHImgBadge, { top: 12, bottom: undefined, left: undefined, right: 12, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                        <ImageIcon size={12} color="#fff" />
                        <Text style={s.cardHImgCount}>{accom.images.length}</Text>
                    </View>
                </TouchableOpacity>
                <View style={[s.cardVBody, { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 14, gap: 8, flexWrap: 'wrap' }]}>
                    <Text style={{ color: tc.textMuted, fontSize: 13, fontWeight: '600' }}>{accom.type}</Text>
                    <Text style={{ color: tc.borderLight, fontSize: 12 }}>•</Text>
                    <View style={s.ratingRow}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={[s.ratingVal, { color: tc.text, fontSize: 13 }]}>{accom.rating}</Text>
                    </View>
                    <Text style={{ color: tc.borderLight, fontSize: 12 }}>•</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                        <MapPin size={12} color={tc.textMuted} />
                        <Text style={{ color: tc.textMuted, fontSize: 13 }} numberOfLines={1}>{accom.address}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── DETAIL MODAL CONTENT ──
    const renderDetail = () => {
        if (!selectedAccom || calendarModal || galleryModal) return null;
        const a = selectedAccom;
        const modalMaxW = isDesktop ? 680 : '95%';
        return (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedAccom(null)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: tc.bgCard, maxWidth: modalMaxW as any }]}>
                        <TouchableOpacity style={s.modalClose} onPress={() => setSelectedAccom(null)}>
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Gallery strip */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryStrip}>
                                {a.images.map((img, i) => (
                                    <TouchableOpacity key={i} onPress={() => { setGalleryIdx(i); setGalleryModal(true); }} activeOpacity={0.85}>
                                        <Image source={{ uri: img }} style={[s.galleryThumb, i === 0 && { width: isDesktop ? 320 : 240 }]} />
                                        <View style={s.galleryZoom}><ZoomIn size={14} color="#fff" /></View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={[s.detailBody, isDesktop && { flexDirection: 'row', gap: 24 }]}>
                                {/* Left column: info */}
                                <View style={[{ flex: 1 }]}>
                                    <View style={s.cardHTopRow}>
                                        <View style={[s.typeBadge, { backgroundColor: colors.primary.DEFAULT + '18' }]}>
                                            <Text style={[s.typeText, { color: colors.primary.DEFAULT }]}>{a.type}</Text>
                                        </View>
                                        <View style={s.ratingRow}>
                                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={[s.ratingVal, { color: tc.text }]}>{a.rating}</Text>
                                            <Text style={[s.ratingCount, { color: tc.textMuted }]}>({a.reviews} reseñas)</Text>
                                        </View>
                                    </View>
                                    <Text style={[s.detailName, { color: tc.text }]}>{a.name}</Text>
                                    <View style={s.addressRow}>
                                        <MapPin size={13} color={tc.textMuted} />
                                        <Text style={[s.addressText, { color: tc.textMuted, fontSize: 13 }]}>{a.address}</Text>
                                    </View>

                                    <Text style={[s.detailDesc, { color: tc.textSecondary }]}>{a.description}</Text>

                                    {/* Info chips */}
                                    <View style={[s.infoRow, { borderColor: tc.borderLight }]}>
                                        <View style={s.infoChip}>
                                            <Text style={[s.infoLabel, { color: tc.textMuted }]}>Check-in</Text>
                                            <Text style={[s.infoValue, { color: tc.text }]}>{a.checkIn}</Text>
                                        </View>
                                        <View style={s.infoChip}>
                                            <Text style={[s.infoLabel, { color: tc.textMuted }]}>Check-out</Text>
                                            <Text style={[s.infoValue, { color: tc.text }]}>{a.checkOut}</Text>
                                        </View>
                                        <View style={s.infoChip}>
                                            <Text style={[s.infoLabel, { color: tc.textMuted }]}>Huéspedes</Text>
                                            <Text style={[s.infoValue, { color: tc.text }]}>{a.guests}</Text>
                                        </View>
                                    </View>

                                    {/* Amenities */}
                                    <Text style={[s.sectionLabel, { color: tc.text }]}>Comodidades</Text>
                                    <View style={s.amenitiesRow}>
                                        {a.amenities.map((am, i) => (
                                            <View key={i} style={[s.amenityChip, { backgroundColor: tc.bgInput }]}>
                                                {renderIcon(AMENITY_ICONS[am] || Wifi, 14, tc.textMuted)}
                                                <Text style={[s.amenityText, { color: tc.textSecondary }]}>{am}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Right column (desktop) or below (mobile): actions */}
                                <View style={[isDesktop ? { width: 240 } : { marginTop: 16 }]}>
                                    <Text style={[s.priceLabel, { color: tc.text }]}>Precio</Text>
                                    <Text style={[s.priceConsultarLg, { color: tc.primary }]}>A consultar</Text>

                                    <TouchableOpacity
                                        style={[s.calendarBtn, { borderColor: colors.primary.DEFAULT }]}
                                        onPress={() => setCalendarModal(true)}
                                    >
                                        <Calendar size={18} color={colors.primary.DEFAULT} />
                                        <Text style={[s.calendarBtnText, { color: colors.primary.DEFAULT }]}>
                                            {selectedDates.length === 2
                                                ? `${selectedDates[0].getDate()}/${selectedDates[0].getMonth() + 1} → ${selectedDates[1].getDate()}/${selectedDates[1].getMonth() + 1}`
                                                : 'Elegir fechas'
                                            }
                                        </Text>
                                    </TouchableOpacity>

                                    <TextInput
                                        style={[s.msgInput, { backgroundColor: tc.bgInput, color: tc.text, borderColor: tc.borderLight }]}
                                        placeholder="Mensaje adicional (opcional)"
                                        placeholderTextColor={tc.textMuted}
                                        value={message}
                                        onChangeText={setMessage}
                                        multiline
                                    />

                                    {/* Contact buttons — compact, not full-width on desktop */}
                                    <View style={s.contactBtns}>
                                        <TouchableOpacity style={[s.contactBtn, { backgroundColor: '#25D366' }]} onPress={() => openWhatsApp(a.phone, buildMessage(a))}>
                                            <MessageCircle size={16} color="#fff" />
                                            <Text style={s.contactBtnText}>WhatsApp</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[s.contactBtn, { backgroundColor: colors.info }]} onPress={() => openEmail(a.email, `Consulta de disponibilidad - ${a.name}`, buildMessage(a))}>
                                            <Mail size={16} color="#fff" />
                                            <Text style={s.contactBtnText}>Email</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[s.contactBtnSm, { backgroundColor: tc.isDark ? '#333' : '#eee' }]} onPress={() => openPhone(a.phone)}>
                                            <Phone size={16} color={tc.text} />
                                            <Text style={[s.contactBtnText, { color: tc.text }]}>Llamar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    // ════════════════ RENDER ════════════════
    return (
        <View style={[s.root, { backgroundColor: tc.bg }]}>
            <SafeAreaView style={s.mainArea} edges={isDesktop ? [] : ['top']}>
                <AppHeader
                    subtitle="ALOJAMIENTOS"
                    title="Dónde quedarse"
                    leftIcon="back"
                    rightButtons={['search']}
                />

                <ScrollView
                    contentContainerStyle={[
                        s.scrollContent,
                        isDesktop && { maxWidth: 1000, alignSelf: 'center', width: '100%' },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Botón de publicación movido aquí para no solapar la UI */}
                    <TouchableOpacity
                        style={[
                            s.publishBanner, 
                            { backgroundColor: tc.primary + '15', borderColor: tc.primary }
                        ]}
                        onPress={handlePublishAccommodation}
                        activeOpacity={0.8}
                    >
                        <View style={[s.publishIconWrapper, { backgroundColor: tc.primary }]}>
                            <Plus size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.publishTitle, { color: tc.text }]}>¿Tenés un alojamiento?</Text>
                            <Text style={[s.publishSub, { color: tc.textMuted }]}>Publicalo gratis y recibí consultas por WhatsApp al instante.</Text>
                        </View>
                    </TouchableOpacity>

                    {displayData.map(accom => renderCard(accom))}
                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>

            {/* FAB Removed */}

            {/* DETAIL MODAL */}
            {renderDetail()}

            {/* CALENDAR MODAL (bigger) */}
            <Modal visible={calendarModal} transparent animationType="fade" onRequestClose={() => setCalendarModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.calendarModalContent, { backgroundColor: tc.bgCard }, isDesktop && { width: 480 }]}>
                        <View style={[s.calendarModalHeader, { borderBottomColor: tc.borderLight }]}>
                            <Text style={[s.calendarModalTitle, { color: tc.text }]}>Seleccioná tus fechas</Text>
                            <TouchableOpacity onPress={() => setCalendarModal(false)}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={s.calendarModalBody}>
                            <Text style={[s.calendarHint, { color: tc.textMuted }]}>
                                {selectedDates.length === 0 ? 'Tocá una fecha de check-in' : selectedDates.length === 1 ? 'Ahora elegí el check-out' : 'Fechas seleccionadas ✓'}
                            </Text>
                            <CalendarPicker selectedDates={selectedDates} onSelect={handleDateSelect} tc={tc} />
                            {selectedDates.length > 0 && (
                                <TouchableOpacity style={s.calendarResetBtn} onPress={() => setSelectedDates([])}>
                                    <Text style={[s.calendarResetText, { color: tc.textMuted }]}>Limpiar fechas</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[s.calendarConfirmBtn, { backgroundColor: colors.primary.DEFAULT }]}
                            onPress={() => setCalendarModal(false)}
                        >
                            <Text style={s.calendarConfirmText}>
                                {selectedDates.length === 2 ? 'Confirmar fechas' : 'Cerrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PHOTO GALLERY MODAL */}
            <Modal visible={galleryModal} transparent animationType="fade" onRequestClose={() => setGalleryModal(false)}>
                <View style={[s.galleryOverlay, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
                    <SafeAreaView style={s.galleryFull}>
                        <View style={s.galleryHeader}>
                            <Text style={s.galleryTitle}>{selectedAccom?.name} — {galleryIdx + 1}/{selectedAccom?.images.length || 0}</Text>
                            <TouchableOpacity onPress={() => setGalleryModal(false)} style={s.galleryCloseBtn}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={s.galleryMainArea}>
                            {galleryIdx > 0 && (
                                <TouchableOpacity style={[s.galleryNavBtn, { left: 12 }]} onPress={() => setGalleryIdx(galleryIdx - 1)}>
                                    <ChevronLeft size={28} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <Image
                                source={{ uri: selectedAccom?.images[galleryIdx] }}
                                style={s.galleryMainImg}
                                resizeMode="contain"
                            />
                            {selectedAccom && galleryIdx < selectedAccom.images.length - 1 && (
                                <TouchableOpacity style={[s.galleryNavBtn, { right: 12 }]} onPress={() => setGalleryIdx(galleryIdx + 1)}>
                                    <ChevronRight size={28} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                        {/* Thumbnails strip */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryThumbStrip}>
                            {selectedAccom?.images.map((img, i) => (
                                <TouchableOpacity key={i} onPress={() => setGalleryIdx(i)}>
                                    <Image source={{ uri: img }} style={[s.galleryThumbSm, i === galleryIdx && { borderColor: colors.primary.DEFAULT, borderWidth: 2 }]} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

// ════════════════ STYLES ════════════════
const s = StyleSheet.create({
    root: { flex: 1 },
    mainArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    backBtn: { position: 'absolute', left: 16, padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, gap: 16 },

    // ── CARD HORIZONTAL (desktop) ──
    cardH: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 1, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */     },
    cardHImg: { width: 260, height: '100%', minHeight: 220 },
    cardHImgBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    cardHImgCount: { color: '#fff', fontSize: 11, fontWeight: '700' },
    cardHBody: { flex: 1, padding: 18, gap: 6, justifyContent: 'space-between' },
    cardHTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardHName: { fontSize: 19, fontWeight: '800' },
    cardHDesc: { fontSize: 13, lineHeight: 19, marginTop: 2 },

    // ── CARD VERTICAL (mobile) ──
    cardV: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */     },
    cardVImg: { width: '100%', height: 200 },
    cardVBody: { padding: 14, gap: 6 },

    // Shared
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 11, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingVal: { fontSize: 13, fontWeight: '700' },
    ratingCount: { fontSize: 11 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    addressText: { fontSize: 12 },
    priceConsultar: { fontSize: 14, fontWeight: '800' },
    priceConsultarLg: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
    priceLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
    amenityText: { fontSize: 11, fontWeight: '500' },

    // Card actions
    cardActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    cardQuickBtns: { flexDirection: 'row', gap: 6 },
    quickBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    calendarQuickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, height: 34 },
    calendarQuickText: { fontSize: 12, fontWeight: '700' },

    // ── DETAIL modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '95%', maxHeight: '92%', borderRadius: 20, overflow: 'hidden' },
    modalClose: { position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    galleryStrip: { gap: 4 },
    galleryThumb: { width: 180, height: 160, borderRadius: 0 },
    galleryZoom: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    detailBody: { padding: 20, gap: 10 },
    detailName: { fontSize: 24, fontWeight: '800' },
    detailDesc: { fontSize: 14, lineHeight: 21, marginTop: 6 },
    sectionLabel: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 4 },

    infoRow: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    infoChip: { flex: 1, alignItems: 'center', gap: 2 },
    infoLabel: { fontSize: 11, fontWeight: '600' },
    infoValue: { fontSize: 14, fontWeight: '700' },

    calendarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderRadius: 14, paddingVertical: 12, marginBottom: 10 },
    calendarBtnText: { fontSize: 14, fontWeight: '700' },

    msgInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 50, textAlignVertical: 'top', marginBottom: 12 },

    contactBtns: { gap: 8 },
    contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    contactBtnSm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
    contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // ── CALENDAR MODAL ──
    calendarModalContent: { width: '92%', maxWidth: 420, borderRadius: 24, overflow: 'hidden' },
    calendarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    calendarModalTitle: { fontSize: 18, fontWeight: '800' },
    calendarModalBody: { padding: 20 },
    calendarHint: { fontSize: 13, textAlign: 'center', marginBottom: 12 },
    calendarResetBtn: { alignSelf: 'center', marginTop: 8 },
    calendarResetText: { fontSize: 13, fontWeight: '600' },
    calendarConfirmBtn: { margin: 16, marginTop: 0, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    calendarConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // ── PHOTO GALLERY MODAL ──
    galleryOverlay: { flex: 1 },
    galleryFull: { flex: 1 },
    galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    galleryTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    galleryCloseBtn: { padding: 8 },
    galleryMainArea: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    galleryMainImg: { width: '90%', height: '85%', borderRadius: 8 },
    galleryNavBtn: { position: 'absolute', top: '45%', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    galleryThumbStrip: { gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
    galleryThumbSm: { width: 64, height: 48, borderRadius: 8 },

    // Banner de Publicación
    publishBanner: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, 
        borderWidth: 1, marginHorizontal: 20, marginBottom: 20, gap: 16
    },
    publishIconWrapper: {
        width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center'
    },
    publishTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    publishSub: { fontSize: 13 },
});
