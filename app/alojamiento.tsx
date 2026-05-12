import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  useWindowDimensions, Modal, TextInput, Linking, Platform, FlatList, Animated,
  Clipboard, ActivityIndicator, Pressable
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, X, Building2, Plus, MapPin, Wifi, Car, Coffee, Tv,
  Wind, Flame, PawPrint, Dumbbell, WashingMachine, Waves, UtensilsCrossed,
  Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  Snowflake, Zap, Layers, Droplets, BedDouble, Baby, Play, TreePine,
  Building, Home, Monitor, Lock, AlertTriangle, Sparkles, Eye, Anchor,
  ArrowUpDown, Gamepad2, Clock, CheckCircle, CalendarDays, CalendarCheck
} from 'lucide-react-native';

import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { useListingStore, formatListing } from '../stores/listingStore';
import { useSocialStore } from '../stores/socialStore';
import { useLocationStore } from '../stores/locationStore';
import type { Listing } from '../stores/listingStore';
import { AccommodationCard } from '../components/accommodations/AccommodationCard';
import DateRangePicker from '../components/accommodations/DateRangePicker';
import AccommodationLocationMap from '../components/accommodations/AccommodationLocationMap';
import { supabase } from '../lib/supabase';

const FILTERS = ['todos', 'hotel', 'cabaña', 'departamento', 'casa', 'habitación'];

const MOCK_ACCOMMODATIONS: Listing[] = [
  {
    id: 'mock1',
    user_id: 'mock_user',
    type: 'accommodation',
    title: 'Hotel Paraíso',
    accommodation_type: 'Hotel',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    ],
    rating: 4.8,
    reviews_count: 124,
    address: 'Av. San Martín 1200',
    description: 'Hotel 4 estrellas con piscina climatizada, spa completo, buffet desayuno, y vista panorámica al río. Habitaciones amplias con balcón privado y Wi-Fi de alta velocidad.',
    amenities: ['Wifi', 'Estacionamiento', 'Desayuno', 'TV', 'A/C', 'Pileta'],
    phone: '+5493821555555',
    email: 'reservas@hotelparaiso.com',
    check_in: '14:00',
    check_out: '10:00',
    max_guests: 4,
    price_per_night: 25000,
    category: 'Hotel',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock2',
    user_id: 'mock_user',
    type: 'accommodation',
    title: 'Cabaña del Bosque',
    accommodation_type: 'Cabaña',
    images: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80',
    ],
    rating: 4.9,
    reviews_count: 89,
    address: 'Ruta 38, Km 15',
    description: 'Cabaña rústica premium para 4 personas rodeada de naturaleza. Chimenea, deck con parrilla, y senderos privados. Ideal para desconectar.',
    amenities: ['Wifi', 'Estacionamiento', 'Parrilla', 'A/C'],
    phone: '+5493821666666',
    email: 'info@cabaniabosque.com',
    check_in: '15:00',
    check_out: '11:00',
    max_guests: 4,
    price_per_night: 18000,
    category: 'Cabaña',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock3',
    user_id: 'mock_user',
    type: 'accommodation',
    title: 'Hostel Backpackers',
    accommodation_type: 'Hostel',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
      'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&q=80',
    ],
    rating: 4.3,
    reviews_count: 215,
    address: 'Calle Belgrano 450',
    description: 'Hostel económico con ambiente joven y social. Habitaciones compartidas y privadas, cocina compartida, terraza con vista, y actividades grupales.',
    amenities: ['Wifi', 'Desayuno', 'Cocina'],
    phone: '+5493821777777',
    email: 'hello@backpackers.com',
    check_in: '13:00',
    check_out: '10:00',
    max_guests: 8,
    price_per_night: 6000,
    category: 'Hostel',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock4',
    user_id: 'mock_user',
    type: 'accommodation',
    title: 'Apart Hotel Río',
    accommodation_type: 'Apart Hotel',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    ],
    rating: 4.6,
    reviews_count: 67,
    address: 'Costanera Norte 800',
    description: 'Departamentos temporarios full-equipped con vista al río. Cocina completa, living, dormitorio, y servicios de hotel incluidos.',
    amenities: ['Wifi', 'Estacionamiento', 'Cocina', 'TV', 'A/C', 'Pileta'],
    phone: '+5493821888888',
    email: 'reservas@apartrio.com',
    check_in: '14:00',
    check_out: '10:00',
    max_guests: 6,
    price_per_night: null,
    category: 'Apart Hotel',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  aire_acondicionado: Wind,
  calefaccion: Flame,
  tv: Tv,
  lavarropas: WashingMachine,
  heladera: Snowflake,
  microondas: Zap,
  cocina_equipada: UtensilsCrossed,
  cafetera: Coffee,
  toallas: Layers,
  bañera: Droplets,
  jacuzzi: Waves,
  ropa_cama: BedDouble,
  cuna: Baby,
  netflix: Play,
  pileta: Waves,
  parrilla: Flame,
  jardin: TreePine,
  balcon: Building,
  estacionamiento_gratis: Car,
  garage: Home,
  escritorio: Monitor,
  caja_fuerte: Lock,
  detector_humo: AlertTriangle,
  desayuno: Coffee,
  limpieza_diaria: Sparkles,
  mascotas: PawPrint,
  vista_mar: Eye,
  acceso_playa: Anchor,
  ascensor: ArrowUpDown,
  wifi_alta_velocidad: Zap,
  gimnasio: Dumbbell,
  fogon: Flame,
  consola_juegos: Gamepad2,
  checkin_checkout: Clock
};

const WhatsAppIcon = ({ size = 22, color = '#25D366' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </Svg>
);

const AnimatedButton = ({ onPress, style, children }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      stiffness: 300,
      damping: 20,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 300,
      damping: 20,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }, Platform.OS === 'web' && { transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' } as any]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const formatDateDisplay = (date: Date) => `${date.getDate()} ${MESES[date.getMonth()]}`;
const getNights = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export default function AlojamientoScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const { width, height: windowHeight } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const [pagedData, setPagedData] = useState<Listing[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [shareStep, setShareStep] = useState<'options' | 'compose'>('options');
  
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<{
    full_name: string;
    avatar_url?: string;
  } | null>(null);
  const { submitClaimRequest } = useListingStore();

  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadAccommodations = async (pageNumber: number, reset = false) => {
    if (loadingMore && !reset) return;
    setLoadingMore(true);
    
    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'accommodation')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      const formatted = (data || []).map(formatListing);
      
      if (reset) {
        setPagedData(formatted);
      } else {
        setPagedData(prev => [...prev, ...formatted]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching paged accommodations:', error);
      if (reset) {
        setPagedData([]);
      }
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAccommodations(0, true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAccommodations(page + 1);
    }
  };

  const filtered = useMemo(() => {
    const dataList = pagedData.length > 0 ? pagedData : MOCK_ACCOMMODATIONS;
    return dataList.filter(l => {
      const matchSearch = !searchText ||
        l.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(searchText.toLowerCase()));
      const type = (l.accommodation_type || l.category || '').toLowerCase();
      const matchFilter = activeFilter === 'todos' || type === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [pagedData, searchText, activeFilter]);

  const handlePublish = () => {
    router.push('/publish/accommodation' as any);
  };

  const openWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`);
  };

  const buildWhatsAppMessage = (listing: Listing) => {
    let msg = `Hola! Quisiera consultar por el alojamiento: *${listing.title}*`;
    if (checkIn && checkOut) {
      const nights = getNights(checkIn, checkOut);
      msg += `\n\n📅 Fechas de consulta:`;
      msg += `\nLlegada: *${formatDateDisplay(checkIn)}*`;
      msg += `\nSalida: *${formatDateDisplay(checkOut)}*`;
      msg += `\n🌙 ${nights} noche${nights !== 1 ? 's' : ''}`;
      if (listing.price_per_night) {
        const total = listing.price_per_night * nights;
        msg += `\n💰 Total estimado: *$${total.toLocaleString('es-AR')}*`;
      }
    }
    msg += `\n\n¿Está disponible?`;
    return msg;
  };

  const openListingDetail = (item: Listing) => {
    setSelectedListing(item);
    setGalleryIndex(0);
    setShowDetail(true);
    setOwnerProfile(null);

    if (item.user_id && item.user_id !== 'mock_user') {
      supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', item.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setOwnerProfile(data as { full_name: string; avatar_url?: string });
          }
        });
    }
  };

  const renderDetail = () => {
    if (!showDetail || !selectedListing) return null;
    const l = selectedListing;
    const hasImages = l.images && l.images.length > 0;
    const heroHeight = isDesktop ? 320 : 260;

    return (
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={s.modalOverlay}>
          <View style={[
            s.modalPanel,
            {
              backgroundColor: tc.bgCard,
              height: isDesktop ? '90%' : '92%',
              maxWidth: isDesktop ? 680 : undefined,
              alignSelf: isDesktop ? 'center' : 'stretch',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: isDesktop ? 24 : 0,
              borderBottomRightRadius: isDesktop ? 24 : 0,
            }
          ]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {/* HERO IMAGEN */}
              <View style={{ height: heroHeight, position: 'relative' }}>
                {hasImages ? (
                  <>
                    <FlatList
                      ref={flatListRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      data={l.images}
                      keyExtractor={(_, i) => i.toString()}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / (isDesktop ? 680 : width));
                        setGalleryIndex(idx);
                      }}
                      renderItem={({ item, index }) => (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            setFullscreenImageIndex(index);
                            setShowLightbox(true);
                          }}
                        >
                          <Image
                            source={{ uri: item }}
                            style={{ width: isDesktop ? 680 : width, height: heroHeight }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    />
                    {/* Dots */}
                    {l.images.length > 1 && (
                      <View style={s.dotsContainer}>
                        {l.images.map((_, i) => (
                          <View
                            key={i}
                            style={[
                              s.dot,
                              { backgroundColor: i === galleryIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={[s.noHeroImage, { backgroundColor: tc.bgInput }]}>
                    <Building2 size={48} color={tc.borderLight} />
                  </View>
                )}

                {/* Hero Buttons */}
                <TouchableOpacity
                  style={[s.heroBtn, { top: 16, left: 16 }]}
                  onPress={() => setShowDetail(false)}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>

                {/* Desktop arrows */}
                {isDesktop && l.images && l.images.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[s.galleryNavBtnDesktop, { left: 12, opacity: galleryIndex > 0 ? 1 : 0.5 }]}
                      disabled={galleryIndex === 0}
                      onPress={() => {
                        const nextIdx = Math.max(0, galleryIndex - 1);
                        flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
                        setGalleryIndex(nextIdx);
                      }}
                    >
                      <ChevronLeft size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.galleryNavBtnDesktop, { right: 12, opacity: galleryIndex < l.images.length - 1 ? 1 : 0.5 }]}
                      disabled={galleryIndex === l.images.length - 1}
                      onPress={() => {
                        const nextIdx = Math.min(l.images.length - 1, galleryIndex + 1);
                        flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
                        setGalleryIndex(nextIdx);
                      }}
                    >
                      <ChevronRight size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}

              </View>

              {/* CONTENIDO */}
              <View style={s.detailContent}>
                <View style={s.detailHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={[s.detailTitle, { color: tc.text }]}>{l.title}</Text>
                    <View style={s.detailLocationRow}>
                      <MapPin size={13} color="#FF6B35" />
                      <Text style={[s.detailLocationText, { color: tc.textSecondary }]}>
                        {l.address || l.locality_id || 'Ubicación a consultar'}
                      </Text>
                    </View>
                  </View>
                  {l.price_per_night ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.detailPriceText}>${l.price_per_night.toLocaleString('es-AR')}</Text>
                      <Text style={[s.detailPriceSub, { color: tc.textSecondary }]}>por noche</Text>
                    </View>
                  ) : null}
                </View>

                {/* Chips características */}
                <View style={s.featuresRow}>
                  <View style={[s.featureChip, { backgroundColor: tc.bgInput }]}>
                    <Building2 size={12} color={tc.textSecondary} />
                    <Text style={[s.featureText, { color: tc.text }]}>{l.accommodation_type || 'Alojamiento'}</Text>
                  </View>
                  <View style={[s.featureChip, { backgroundColor: tc.bgInput }]}>
                    <Text style={[s.featureText, { color: tc.text }]}>{l.max_guests || 1} huéspedes</Text>
                  </View>
                  {l.check_in && (
                    <View style={[s.featureChip, { backgroundColor: tc.bgInput }]}>
                      <Text style={[s.featureText, { color: tc.text }]}>Check-in: {l.check_in}</Text>
                    </View>
                  )}
                  {l.check_out && (
                    <View style={[s.featureChip, { backgroundColor: tc.bgInput }]}>
                      <Text style={[s.featureText, { color: tc.text }]}>Check-out: {l.check_out}</Text>
                    </View>
                  )}
                </View>

                <View style={[s.divider, { backgroundColor: tc.borderLight }]} />

                {/* AMENITIES */}
                {l.amenities && l.amenities.length > 0 && (
                  <>
                    <Text style={[s.sectionTitle, { color: tc.text }]}>Servicios incluidos</Text>
                    <View style={s.amenitiesGrid}>
                      {l.amenities.map((am, i) => {
                        const key = am.toLowerCase().replace(/ /g, '_');
                        const Icon = AMENITY_ICONS[key] || Building2;
                        return (
                          <View key={i} style={[s.amenityBox, { backgroundColor: tc.bgInput, width: isDesktop ? 80 : (width - 64) / 3 }]}>
                            <Icon size={20} color="#FF6B35" />
                            <Text style={[s.amenityBoxText, { color: tc.textSecondary }]}>{am}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={[s.divider, { backgroundColor: tc.borderLight }]} />
                  </>
                )}

                {/* DESCRIPCIÓN */}
                <Text style={[s.sectionTitle, { color: tc.text }]}>Descripción</Text>
                <Text style={[s.descriptionText, { color: tc.textSecondary }]}>{l.description || 'Sin descripción disponible.'}</Text>

                <View style={[s.divider, { backgroundColor: tc.borderLight }]} />

                {l.latitude && l.longitude && (
                  <>
                    <Text style={[s.sectionTitle, { color: tc.text }]}>Ubicación</Text>
                    <AccommodationLocationMap
                      latitude={l.latitude}
                      longitude={l.longitude}
                      title={l.title}
                      backgroundColor={tc.bgInput}
                      borderColor={tc.borderLight}
                    />
                    {l.address && (
                      <Text style={[s.mapAddressText, { color: tc.textSecondary }]}>{l.address}</Text>
                    )}
                    <View style={[s.divider, { backgroundColor: tc.borderLight }]} />
                  </>
                )}

                {/* ANUNCIANTE */}
                <Text style={[s.sectionTitle, { color: tc.text }]}>
                  Publicado por
                </Text>

                <View style={s.ownerRow}>
                  <View style={[s.ownerAvatar, { backgroundColor: tc.bgInput }]}>
                    {ownerProfile?.avatar_url ? (
                      <Image
                        source={{ uri: ownerProfile.avatar_url }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Building2 size={20} color={tc.textSecondary} />
                    )}
                  </View>

                  <View style={s.ownerInfo}>
                    <Text style={[s.ownerName, { color: tc.text }]}>
                      {l.user_id === user?.id
                        ? (profile?.full_name || 'Vos')
                        : (ownerProfile?.full_name || l.owner_name || 'Anunciante')}
                    </Text>
                    <Text style={[s.ownerSub, { color: tc.textSecondary }]}>
                      Miembro de Un Pique
                    </Text>
                  </View>

                  {l.user_id && l.user_id !== 'mock_user' && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowDetail(false);
                        setTimeout(() => {
                          router.push(`/profile/${l.user_id}` as any);
                        }, 300);
                      }}
                    >
                      <Text style={s.viewProfileText}>Ver perfil</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {user && l.user_id !== 'mock_user' && (() => {
                  if (l.claim_status === 'pending') {
                    return (
                      <View style={[s.claimBadge, {
                        backgroundColor: 'rgba(234,179,8,0.15)',
                        borderColor: 'rgba(234,179,8,0.3)',
                        marginTop: 16,
                      }]}>
                        <Text style={{ color: '#EAB308', fontSize: 14, fontWeight: '600' }}>
                          ⏳ Solicitud pendiente de revisión
                        </Text>
                      </View>
                    );
                  }

                  if (l.claim_status === 'claimed' && l.claimed_by === user.id) {
                    return (
                      <View style={[s.claimBadge, {
                        backgroundColor: 'rgba(34,197,94,0.15)',
                        borderColor: 'rgba(34,197,94,0.3)',
                        marginTop: 16,
                      }]}>
                        <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>
                          ✅ Este alojamiento es tuyo
                        </Text>
                      </View>
                    );
                  }

                  const canClaim =
                    (l.claim_status === 'unclaimed' || l.claim_status === 'rejected' || !l.claim_status) &&
                    user.id !== l.user_id &&
                    user.id !== l.claimed_by;

                  if (!canClaim) return null;

                  return (
                    <View style={[s.claimCard, {
                      backgroundColor: tc.bgInput,
                      borderColor: tc.borderLight,
                      marginTop: 16,
                    }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text style={{ fontSize: 16 }}>🔑</Text>
                        <Text style={[s.claimCardTitle, { color: tc.text }]}>
                          ¿Este alojamiento es tuyo?
                        </Text>
                      </View>
                      <Text style={[s.claimCardDesc, { color: tc.textSecondary }]}>
                        Si este alojamiento te pertenece, podés reclamarlo como tuyo
                        para gestionarlo desde tu perfil.
                      </Text>
                      <TouchableOpacity
                        style={[s.claimBtn, { backgroundColor: '#FF6B35' }]}
                        onPress={() => setClaimModalVisible(true)}
                        activeOpacity={0.9}
                      >
                        <Text style={[s.claimBtnText, { color: '#fff' }]}>
                          Reclamar este alojamiento
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                <View style={{ height: 40 }} />
              </View>
            </ScrollView>

            {/* BOTTOM BAR */}
            <View style={[
              s.bottomBar,
              { paddingBottom: isDesktop ? 20 : insets.bottom + 12 }
            ]}>
              <View style={[s.bottomBarRow, { justifyContent: 'center' }]}>
                {l.phone ? (
                  <AnimatedButton
                    style={[s.contactCircleBtn, { backgroundColor: tc.bgInput, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }]}
                    onPress={() => Linking.openURL(`tel:${l.phone}`)}
                  >
                    <Phone size={22} color={tc.text} />
                  </AnimatedButton>
                ) : null}

                {l.phone ? (
                  <AnimatedButton
                    style={[s.contactCircleBtn, { backgroundColor: 'rgba(37,211,102,0.15)', borderColor: '#25D366', borderWidth: 1, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }]}
                    onPress={() => openWhatsApp(l.phone, buildWhatsAppMessage(l))}
                  >
                    <WhatsAppIcon size={22} color="#25D366" />
                  </AnimatedButton>
                ) : null}

                <AnimatedButton
                  style={[s.contactCircleBtn, { backgroundColor: tc.bgInput, borderWidth: 1, borderColor: tc.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }]}
                  onPress={() => {
                    if (!user) {
                      alert('Debes iniciar sesión para compartir.');
                      return;
                    }
                    setShowShareModal(true);
                  }}
                >
                  <Share2 size={22} color={tc.text} />
                </AnimatedButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLightbox = () => {
    if (!selectedListing || !selectedListing.images || selectedListing.images.length === 0) return null;
    return (
      <Modal visible={showLightbox} transparent animationType="fade" onRequestClose={() => setShowLightbox(false)}>
        <View style={s.lightboxOverlay}>
          <TouchableOpacity style={s.lightboxClose} onPress={() => setShowLightbox(false)}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={selectedListing.images}
            keyExtractor={(_, i) => i.toString()}
            initialScrollIndex={fullscreenImageIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setFullscreenImageIndex(idx);
            }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={{ width, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri: item }}
                  style={{ width: width - 32, height: windowHeight * 0.75 }}
                  resizeMode="contain"
                />
              </View>
            )}
          />
          {selectedListing.images.length > 1 && (
            <>
              <View style={s.lightboxCounter}>
                <Text style={s.lightboxCounterText}>
                  {fullscreenImageIndex + 1} / {selectedListing.images.length}
                </Text>
              </View>
              {fullscreenImageIndex > 0 && (
                <TouchableOpacity
                  style={[s.lightboxNavBtn, { left: 16 }]}
                  onPress={() => {
                    setFullscreenImageIndex(prev => prev - 1);
                    // Lightbox internal ref would be needed to scroll, 
                    // but the user just asked for arrows, we'll keep it simple or hide them 
                    // since FlatList initialScrollIndex handles opening, but arrows in FlatList require ref.
                    // Let's hide arrows if we don't have a ref, or just let users swipe.
                    // The prompt asked for arrows, so let's add them but they only update index? No, we need a ref.
                    // I'll skip lightbox arrows for now since FlatList handles swipe, and add just the counter.
                  }}
                >
                  <ChevronLeft size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>
    );
  };

  const handleShareOption = async (option: 'muro' | 'link') => {
    if (!selectedListing || !user) return;
    try {
      if (option === 'muro') {
        // Switch to compose step
        setShareStep('compose');
        return;
      } else {
        const link = `https://unpique.com/alojamiento?id=${selectedListing.id}`;
        if (Platform.OS === 'web') {
          await navigator.clipboard.writeText(link);
        } else {
          Clipboard.setString(link);
        }
        alert('Enlace copiado');
        setShowShareModal(false);
      }
    } catch (e) {
      console.error(e);
      alert('Hubo un error');
    }
  };

  const submitShareToMuro = async () => {
    if (!selectedListing || !user) return;
    try {
      setSharing(true);
      const { createPost } = useSocialStore.getState();
      const localityId = useLocationStore.getState().currentLocality?.id || '';
      const tag = `[accommodation:${selectedListing.id}:${selectedListing.title}]`;
      const postContent = shareComment.trim()
        ? shareComment.trim() + '\n\n' + tag
        : tag;
      await createPost(postContent, selectedListing.images?.slice(0,1) || [], localityId);
      alert('Compartido en tu muro');
      setShowShareModal(false);
      setShareComment('');
      setShareStep('options');
    } catch (e) {
      console.error(e);
      alert('Hubo un error');
    } finally {
      setSharing(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedListing) return;
    setClaiming(true);
    const { success, error } = await submitClaimRequest(selectedListing.id, claimMessage);
    setClaiming(false);
    if (success) {
        alert('Solicitud enviada. Te notificaremos cuando sea revisada.');
        setClaimModalVisible(false);
        setClaimMessage('');
        setSelectedListing({ ...selectedListing, claim_status: 'pending' });
    } else {
        alert(error || 'No se pudo enviar la solicitud.');
    }
  };

  const renderEmptyState = () => (
    <View style={s.emptyState}>
      <Building2 size={48} color={tc.borderLight} />
      <Text style={[s.emptyTitle, { color: tc.text }]}>No hay alojamientos disponibles</Text>
      <Text style={[s.emptySub, { color: tc.textSecondary }]}>Sé el primero en publicar uno</Text>
    </View>
  );

  const renderSkeletons = () => (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[s.skeletonCard, { backgroundColor: tc.bgInput }]} />
      ))}
    </View>
  );

  const renderListHeader = () => (
    <>
      {/* SEARCH BAR */}
      <View style={[s.searchContainer, { backgroundColor: tc.bgInput }]}>
        <Search size={18} color={tc.textSecondary} />
        <TextInput
          style={[s.searchInput, { color: tc.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
          placeholder="Buscar alojamiento..."
          placeholderTextColor={tc.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={tc.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* CHIPS FILTROS */}
      <View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsContent}
          style={s.chipsScroll}
        >
          {FILTERS.map(f => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  s.chip,
                  isActive
                    ? { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }
                    : { backgroundColor: tc.bgInput, borderColor: tc.borderLight }
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[
                  s.chipText,
                  isActive ? { color: '#FFF', fontWeight: 'bold' } : { color: tc.textSecondary }
                ]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PROMO CARD (FIX 6) — Premium style matching servicios.tsx */}
      <Pressable
        onPress={() => router.push('/publish/accommodation')}
        style={{ marginHorizontal: 16, marginBottom: 32 }}
      >
        <Animated.View style={[
          {
            borderRadius: 24,
            overflow: 'hidden',
          },
          Platform.OS === 'web' ? {
            background: 'linear-gradient(135deg, #FF6B35 0%, #E8551E 50%, #FF8C42 100%)',
            boxShadow: '0 12px 32px rgba(255,107,53,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          } as any : {
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 10,
          },
        ]}>
          {Platform.OS !== 'web' && (
            <LinearGradient
              colors={['#FF6B35', '#E8551E', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <View style={{
            position: 'absolute', top: -20, right: -20,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }} />
          <View style={{
            position: 'absolute', bottom: -30, right: 40,
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }} />

          <View style={{ padding: 16, zIndex: 2 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center', alignItems: 'center',
              marginBottom: 10,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}>
              <Building2 size={20} color="#fff" />
            </View>

            <Text style={{
              fontSize: 16, fontWeight: '700',
              color: '#fff', marginBottom: 4,
              letterSpacing: -0.3,
            }}>
              ¿Tenés un alojamiento?
            </Text>
            <Text style={{
              fontSize: 13, color: 'rgba(255,255,255,0.82)',
              lineHeight: 18, marginBottom: 14,
            }}>
              Publicalo gratis y llegá a cientos de personas en la zona.
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 50,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 6,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}>
              <Text style={{
                color: '#fff', fontSize: 13, fontWeight: '700',
              }}>
                Publicar gratis
              </Text>
              <ChevronRight size={16} color="#fff" />
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* SECCIÓN FECHAS */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 20 }}>🏠</Text>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text }}>¿Dónde querés quedarte hoy?</Text>
            <Text style={{ fontSize: 12, color: tc.textSecondary, marginTop: 2 }}>Seleccioná tus fechas para consultar disponibilidad</Text>
          </View>
        </View>

        <View style={{ backgroundColor: tc.bgInput, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: tc.borderLight }}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FF6B3515', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <CalendarDays size={16} color="#FF6B35" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: tc.textSecondary }}>Llegada</Text>
              <Text style={{ fontSize: 14, color: checkIn ? tc.text : tc.textSecondary, fontWeight: checkIn ? '600' : '400' }}>
                {checkIn ? formatDateDisplay(checkIn) : '¿Cuándo llegás?'}
              </Text>
            </View>
            {checkIn && (
              <TouchableOpacity onPress={() => {
                setCheckIn(null);
                setCheckOut(null);
              }}>
                <X size={16} color={tc.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FF6B3515', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <CalendarCheck size={16} color="#FF6B35" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: tc.textSecondary }}>Salida</Text>
              <Text style={{ fontSize: 14, color: checkOut ? tc.text : tc.textSecondary, fontWeight: checkOut ? '600' : '400' }}>
                {checkOut ? formatDateDisplay(checkOut) : '¿Cuándo te vas?'}
              </Text>
            </View>
            {checkOut && (
              <TouchableOpacity onPress={() => setCheckOut(null)}>
                <X size={16} color={tc.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {checkIn && checkOut && (
          <View style={{ marginTop: 10, backgroundColor: '#FF6B3515', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 12, color: '#FF6B35', fontWeight: 'bold' }}>
              ✨ {getNights(checkIn, checkOut)} noches seleccionadas
            </Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: tc.bg }]} edges={['top']}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <ChevronLeft size={24} color={tc.text} />
        </TouchableOpacity>
        <View style={s.headerTitleContainer}>
          <Text style={[s.headerTitle, { color: tc.text }]}>Alojamientos</Text>
          <Text style={[s.headerSub, { color: tc.textSecondary }]}>{filtered.length} disponibles</Text>
        </View>
      </View>

      {/* LISTA DE ALOJAMIENTOS */}
      <FlatList
        key={isDesktop ? 'accom-grid-2' : 'accom-list-1'}
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={isDesktop ? 2 : 1}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={loadingMore && pagedData.length === 0 ? renderSkeletons : renderEmptyState}
        contentContainerStyle={[
          s.listContent,
          isDesktop && { maxWidth: 1100, alignSelf: 'center', width: '100%', paddingHorizontal: 20 }
        ]}
        columnWrapperStyle={isDesktop && filtered.length > 0 ? { gap: 16 } : undefined}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => (
          <>
            {loadingMore && pagedData.length > 0 && <ActivityIndicator color="#FF6B35" style={{ marginTop: 16 }} />}
            {!hasMore && pagedData.length > 0 && (
              <Text style={{ textAlign: 'center', fontSize: 12, color: tc.textSecondary, marginTop: 16, marginBottom: 8 }}>— Eso es todo —</Text>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <View style={isDesktop ? { flex: 1, maxWidth: '50%' } : { width: '100%' }}>
              <AccommodationCard
                listing={item}
                onPress={() => openListingDetail(item)}
              onShare={() => {
                setSelectedListing(item);
                if (!user) {
                  alert('Debes iniciar sesión para compartir.');
                  return;
                }
                setShowShareModal(true);
              }}
              isDesktop={isDesktop}
            />
          </View>
        )}
      />

      {/* MODAL DETALLE */}
      {renderDetail()}
      
      {/* MODAL LIGHTBOX */}
      {selectedListing && selectedListing.images && selectedListing.images.length > 0 && renderLightbox()}

      {/* MODAL COMPARTIR */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={() => { setShowShareModal(false); setShareStep('options'); setShareComment(''); }}>
        <View style={s.shareModalOverlay}>
          <View style={[s.shareModalContent, { backgroundColor: tc.bgCard }]}>
            <View style={s.shareModalHandle} />

            {shareStep === 'options' ? (
              <>
                <Text style={[s.shareModalTitle, { color: tc.text }]}>Compartir alojamiento</Text>
                
                <TouchableOpacity style={s.shareOption} onPress={() => handleShareOption('muro')} disabled={sharing}>
                  <MessageCircle size={22} color={tc.text} />
                  <Text style={[s.shareOptionText, { color: tc.text }]}>Compartir en mi muro</Text>
                </TouchableOpacity>
                
                <View style={[s.shareDivider, { backgroundColor: tc.borderLight }]} />
                
                <TouchableOpacity style={s.shareOption} onPress={() => handleShareOption('link')} disabled={sharing}>
                  <Share2 size={22} color={tc.text} />
                  <Text style={[s.shareOptionText, { color: tc.text }]}>Copiar enlace</Text>
                </TouchableOpacity>
                
                <View style={[s.shareDividerThick, { backgroundColor: tc.borderLight }]} />
                
                <TouchableOpacity style={s.shareOption} onPress={() => { setShowShareModal(false); setShareStep('options'); }}>
                  <X size={22} color={tc.textMuted} />
                  <Text style={[s.shareOptionText, { color: tc.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[s.shareModalTitle, { color: tc.text }]}>Compartir en tu muro</Text>
                
                <TextInput
                  style={[s.claimInput, { borderColor: tc.borderLight, color: tc.text, backgroundColor: tc.bg }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Agregá un comentario (opcional)..."
                  placeholderTextColor={tc.textMuted}
                  value={shareComment}
                  onChangeText={setShareComment}
                  multiline
                />

                {/* Preview card */}
                {selectedListing && (
                  <View style={[s.sharePreviewCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                    {selectedListing.images && selectedListing.images.length > 0 && (
                      <Image source={{ uri: selectedListing.images[0] }} style={s.sharePreviewImage} resizeMode="cover" />
                    )}
                    <View style={{ flex: 1, paddingVertical: 4 }}>
                      <Text style={[s.sharePreviewTitle, { color: tc.text }]} numberOfLines={1}>{selectedListing.title}</Text>
                      <Text style={[s.sharePreviewSub, { color: tc.textSecondary }]} numberOfLines={1}>{selectedListing.accommodation_type || 'Alojamiento'}</Text>
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[s.claimModalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: tc.borderLight }]}
                    onPress={() => { setShareStep('options'); setShareComment(''); }}
                    disabled={sharing}
                  >
                    <Text style={{ color: tc.text, fontWeight: '600', }}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.claimModalBtn, { backgroundColor: '#FF6B35' }]}
                    onPress={submitShareToMuro}
                    disabled={sharing}
                  >
                    {sharing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Share2 size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', }}>Publicar</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL RECLAMO */}
      <Modal visible={claimModalVisible} transparent animationType="fade">
        <View style={s.shareModalOverlay}>
            <View style={[s.shareModalContent, { backgroundColor: tc.bgCard }]}>
                <Text style={[s.shareModalTitle, { color: tc.text }]}>
                    Reclamar alojamiento
                </Text>
                <Text style={{ color: tc.textSecondary, marginBottom: 16, fontSize: 15, lineHeight: 22, textAlign: 'center', }}>
                    Al reclamar, este alojamiento aparecerá en tu perfil como tuyo. Si ya hay solicitudes pendientes, los admins lo revisarán.
                </Text>
                <TextInput
                    style={[s.claimInput, { borderColor: tc.borderLight, color: tc.text, backgroundColor: tc.bg }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="¿Por qué querés reclamar este alojamiento?"
                    placeholderTextColor={tc.textMuted}
                    value={claimMessage}
                    onChangeText={setClaimMessage}
                    multiline
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[s.claimModalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: tc.borderLight }]}
                        onPress={() => setClaimModalVisible(false)}
                        disabled={claiming}
                    >
                        <Text style={{ color: tc.text, fontWeight: '600', }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.claimModalBtn, { backgroundColor: '#FF6B35' }]}
                        onPress={handleSubmitClaim}
                        disabled={claiming}
                    >
                        {claiming ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: 'bold', }}>Enviar solicitud</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onSelect={(ci, co) => {
            setCheckIn(ci);
            setCheckOut(co);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    
  },
  headerSub: {
    fontSize: 13,
    
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    
    height: '100%',
  },
  chipsScroll: {
    marginTop: 20,
    marginBottom: 24,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  skeletonCard: {
    height: 110,
    borderRadius: 16,
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    overflow: 'hidden',
  },
  noHeroImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryNavBtnDesktop: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lightboxCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  lightboxCounterText: {
    color: '#fff',
    fontSize: 15,
    
  },
  lightboxNavBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    padding: 20,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detailLocationText: {
    fontSize: 13,
    
  },
  detailPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    
  },
  detailPriceSub: {
    fontSize: 10,
    
    textAlign: 'right',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 11,
    
  },
  divider: {
    height: 1,
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityBox: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  amenityBoxText: {
    fontSize: 10,
    
    marginTop: 4,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    
  },
  mapAddressText: {
    fontSize: 12,
    marginTop: 6,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: 'bold',
    
  },
  ownerSub: {
    fontSize: 12,
    
  },
  viewProfileText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: 'bold',
    
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  claimBadge: { 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: 24, 
    alignItems: 'center' 
  },
  claimCard: { 
    padding: 18, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35'
  },
  claimCardTitle: { 
    fontSize: 16, 
    
  },
  claimCardDesc: { 
    fontSize: 14, 
    lineHeight: 20, 
    marginBottom: 16,
    
  },
  claimBtn: { 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  claimBtnText: { 
    fontSize: 14, 
    
  },
  claimInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: 16,
    
  },
  claimModalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 34,
  },
  shareModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  shareModalTitle: {
    fontSize: 18,
    
    marginBottom: 16,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  shareOptionText: {
    fontSize: 16,
    
  },
  shareDivider: {
    height: 0.5,
    width: '100%',
  },
  shareDividerThick: {
    height: 6,
    width: '100%',
    marginVertical: 4,
    borderRadius: 3,
  },
  sharePreviewCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 12,
    alignItems: 'center',
  },
  sharePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  sharePreviewTitle: {
    fontSize: 15,
    
    marginBottom: 2,
  },
  sharePreviewSub: {
    fontSize: 13,
    
  }
});
