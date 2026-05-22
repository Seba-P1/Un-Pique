// Publicar Alojamiento — formulario de 2 pasos
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
  Animated, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Check, ChevronRight, ChevronLeft,
  Wifi, Car, Coffee, Tv, Snowflake, Users, Waves, ImageIcon, X,
  CheckCircle, User, Heart, Search, MapPin, AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useListingStore } from '../../stores/listingStore';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';
import { pickMultipleImages, uploadImage } from '../../services/imageUpload';
import { supabase } from '../../lib/supabase';
import AddressMapPreview from '../../components/accommodations/AddressMapPreview';
import MapExpandedModal from '../../components/accommodations/MapExpandedModal';

const ACCOMMODATION_TYPES = [
  'Hotel', 'Cabaña', 'Departamento', 'Casa',
  'Hostel', 'Apart Hotel', 'Glamping', 'Otro',
];

const AMENITIES_CATEGORIES = [
  {
    name: 'Esenciales',
    items: [
      { key: 'wifi', label: 'WiFi' },
      { key: 'aire_acondicionado', label: 'Aire acondicionado' },
      { key: 'calefaccion', label: 'Calefacción' },
      { key: 'tv', label: 'Smart TV' },
      { key: 'lavarropas', label: 'Lavarropas' },
      { key: 'secadora', label: 'Secadora' },
      { key: 'heladera', label: 'Heladera' },
      { key: 'microondas', label: 'Microondas' },
      { key: 'cocina_equipada', label: 'Cocina equipada' },
      { key: 'cafetera', label: 'Cafetera' },
      { key: 'plancha', label: 'Plancha' },
    ]
  },
  {
    name: 'Baño',
    items: [
      { key: 'shampoo', label: 'Shampoo' },
      { key: 'acondicionador', label: 'Acondicionador' },
      { key: 'jabon', label: 'Jabón' },
      { key: 'toallas', label: 'Toallas' },
      { key: 'secador_pelo', label: 'Secador de pelo' },
      { key: 'bañera', label: 'Bañera' },
      { key: 'jacuzzi', label: 'Jacuzzi' },
    ]
  },
  {
    name: 'Dormitorio',
    items: [
      { key: 'ropa_cama', label: 'Ropa de cama' },
      { key: 'almohadas_extra', label: 'Almohadas extra' },
      { key: 'perchero', label: 'Perchero / placard' },
      { key: 'cuna', label: 'Cuna disponible' },
      { key: 'silla_alta', label: 'Silla alta para bebé' },
    ]
  },
  {
    name: 'Entretenimiento',
    items: [
      { key: 'netflix', label: 'Netflix / Streaming' },
      { key: 'consola_juegos', label: 'Consola de juegos' },
      { key: 'libros', label: 'Libros / revistas' },
      { key: 'mesa_billar', label: 'Mesa de billar' },
      { key: 'ping_pong', label: 'Ping pong' },
      { key: 'juegos_mesa', label: 'Juegos de mesa' },
    ]
  },
  {
    name: 'Exterior y esparcimiento',
    items: [
      { key: 'pileta', label: 'Pileta / Piscina' },
      { key: 'jacuzzi_exterior', label: 'Jacuzzi exterior' },
      { key: 'parrilla', label: 'Parrilla / BBQ' },
      { key: 'jardin', label: 'Jardín / Patio' },
      { key: 'balcon', label: 'Balcón / Terraza' },
      { key: 'fogon', label: 'Fogón' },
      { key: 'hamacas', label: 'Hamacas' },
      { key: 'cancha_tenis', label: 'Cancha de tenis' },
      { key: 'gimnasio', label: 'Gimnasio' },
    ]
  },
  {
    name: 'Estacionamiento',
    items: [
      { key: 'estacionamiento_gratis', label: 'Estacionamiento gratuito' },
      { key: 'estacionamiento_pago', label: 'Estacionamiento (pago)' },
      { key: 'garage', label: 'Garage cerrado' },
      { key: 'cargador_electrico', label: 'Cargador vehículo eléctrico' },
    ]
  },
  {
    name: 'Trabajo',
    items: [
      { key: 'escritorio', label: 'Escritorio de trabajo' },
      { key: 'silla_ergonomica', label: 'Silla ergonómica' },
      { key: 'wifi_alta_velocidad', label: 'WiFi alta velocidad' },
      { key: 'impresora', label: 'Impresora' },
    ]
  },
  {
    name: 'Seguridad',
    items: [
      { key: 'caja_fuerte', label: 'Caja fuerte' },
      { key: 'detector_humo', label: 'Detector de humo' },
      { key: 'extintor', label: 'Extintor' },
      { key: 'botiquin', label: 'Botiquín de primeros auxilios' },
      { key: 'camara_exterior', label: 'Cámara exterior (informada)' },
      { key: 'cerradura_digital', label: 'Cerradura digital' },
    ]
  },
  {
    name: 'Servicios incluidos',
    items: [
      { key: 'desayuno', label: 'Desayuno incluido' },
      { key: 'limpieza_diaria', label: 'Limpieza diaria' },
      { key: 'recepcion_24h', label: 'Recepción 24hs' },
      { key: 'traslado_aeropuerto', label: 'Traslado al aeropuerto' },
      { key: 'conserje', label: 'Servicio de conserje' },
    ]
  },
  {
    name: 'Accesibilidad',
    items: [
      { key: 'acceso_silla_ruedas', label: 'Acceso para silla de ruedas' },
      { key: 'ascensor', label: 'Ascensor' },
      { key: 'rampa', label: 'Rampa de acceso' },
      { key: 'baño_adaptado', label: 'Baño adaptado' },
    ]
  },
  {
    name: 'Mascotas y naturaleza',
    items: [
      { key: 'mascotas', label: 'Se aceptan mascotas' },
      { key: 'vista_mar', label: 'Vista al mar/lago' },
      { key: 'vista_montaña', label: 'Vista a la montaña' },
      { key: 'acceso_playa', label: 'Acceso directo a la playa' },
      { key: 'acceso_lago', label: 'Acceso directo al lago' },
      { key: 'bosque', label: 'Entorno natural / Bosque' },
    ]
  }
];

const renderIcon = (Icon: React.ComponentType<{ size: number; color: string }>, size: number, color: string) => (
  <Icon size={size} color={color} />
);

export default function PublishAccommodationScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { createListing, saving } = useListingStore();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;
  const isEditing = !!editId;

  const [step, setStep] = useState(1);
  // Paso 1
  const [title, setTitle] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [description, setDescription] = useState('');
  // Paso 2
  const [phone, setPhone] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressLocality, setAddressLocality] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [maxGuests, setMaxGuests] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [checkIn, setCheckIn] = useState('14:00');
  const [checkOut, setCheckOut] = useState('10:00');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoFound, setGeoFound] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const webInputStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768;
  const mapFadeAnim = useRef(new Animated.Value(0)).current;
  // Contribution system
  const [isContribution, setIsContribution] = useState(false);
  const [suggestedOwnerName, setSuggestedOwnerName] = useState('');
  const [suggestedOwnerPhone, setSuggestedOwnerPhone] = useState('');

  // Pre-load data for edit mode
  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    const load = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', editId).single();
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setAccommodationType(data.accommodation_type || data.category || '');
        setPhone(data.phone || '');
        // Parse full address (expected format: "Street Num, Locality, Province")
        const addrParts = (data.address || '').split(',').map((s: string) => s.trim());
        if (addrParts.length >= 1) {
          const streetNum = addrParts[0];
          const addrMatch = streetNum.match(/^(.+?)\s+(\d+.*)$/);
          if (addrMatch) {
            setAddressStreet(addrMatch[1]);
            setAddressNumber(addrMatch[2]);
          } else {
            setAddressStreet(streetNum);
            setAddressNumber('');
          }
        }
        if (addrParts.length >= 2) setAddressLocality(addrParts[1]);
        if (addrParts.length >= 3) setAddressProvince(addrParts[2]);
        setAmenities(data.amenities || []);
        setMaxGuests(data.max_guests ? String(data.max_guests) : '');
        setPricePerNight(data.price_per_night ? String(data.price_per_night) : '');
        setCheckIn(data.check_in || '14:00');
        setCheckOut(data.check_out || '10:00');
        setLatitude(typeof data.latitude === 'number' ? data.latitude : null);
        setLongitude(typeof data.longitude === 'number' ? data.longitude : null);
        const hasGeo = typeof data.latitude === 'number' && typeof data.longitude === 'number';
        setGeoFound(hasGeo);
        if (hasGeo) mapFadeAnim.setValue(1);
        if (data.images && data.images.length > 0) setImageUris(data.images);
      }
      setLoadingEdit(false);
    };
    load();
  }, [editId]);

  const canGoNext = step === 1
    ? title.trim().length > 0 && accommodationType.length > 0
    : phone.trim().length > 0;

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const getFullAddress = () => {
    const street = addressStreet.trim();
    const num = addressNumber.trim();
    const locality = addressLocality.trim();
    const province = addressProvince.trim();
    
    let parts = [];
    if (street) parts.push(num ? `${street} ${num}` : street);
    if (locality) parts.push(locality);
    if (province) parts.push(province);
    
    return parts.join(', ');
  };

  const geocodeAddress = async () => {
    const fullAddress = getFullAddress();
    if (!addressStreet.trim() || addressStreet.trim().length < 3) {
      showAlert('Atenci\u00f3n', 'Ingres\u00e1 una direcci\u00f3n v\u00e1lida para buscar.');
      return;
    }
    setGeocoding(true);
    setGeoFound(false);
    setGeoError(false);
    mapFadeAnim.setValue(0);

    try {
      const query = encodeURIComponent(`${fullAddress}, Argentina`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'User-Agent': 'UnPique-App/1.0' } }
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        setGeoFound(true);
        setGeoError(false);
        // Fade in the map preview
        Animated.timing(mapFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        setLatitude(null);
        setLongitude(null);
        setGeoError(true);
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
      setLatitude(null);
      setLongitude(null);
      setGeoError(true);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Error', 'Necesitás estar logueado para publicar.');
      return;
    }

    // Subir imágenes si hay o mantener las existentes
    let uploadedUrls: string[] = [];
    if (imageUris.length > 0) {
      setUploadingImages(true);
      try {
        for (const uri of imageUris) {
          if (uri.startsWith('http')) {
            uploadedUrls.push(uri);
          } else {
            const result = await uploadImage(uri, 'listings', 'accommodations', { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
            uploadedUrls.push(result.url);
          }
        }
      } catch (err) {
        showAlert('Error', 'No se pudieron subir las imágenes. Intentá de nuevo.');
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    if (isEditing) {
      const { error: updateError } = await supabase.from('listings')
        .update({
          title: title.trim(),
          category: accommodationType,
          accommodation_type: accommodationType,
          description: description.trim(),
          phone: phone.trim(),
          address: getFullAddress(),
          amenities,
          max_guests: maxGuests ? parseInt(maxGuests, 10) : null,
          price_per_night: pricePerNight ? parseFloat(pricePerNight) : null,
          check_in: checkIn,
          check_out: checkOut,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          images: uploadedUrls,
        })
        .eq('id', editId);

      if (updateError) {
        showAlert('Error', updateError.message);
        return;
      }
      showAlert('¡Actualizado!', 'Tu alojamiento fue actualizado correctamente.');
      router.back();
      return;
    }

    const { data, error } = await createListing({
      type: 'accommodation',
      title: title.trim(),
      category: accommodationType,
      accommodation_type: accommodationType,
      description: description.trim(),
      phone: phone.trim(),
      address: getFullAddress(),
      amenities,
      max_guests: maxGuests ? parseInt(maxGuests, 10) : undefined,
      price_per_night: pricePerNight ? parseFloat(pricePerNight) : null,
      check_in: checkIn,
      check_out: checkOut,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      images: uploadedUrls,
      is_contribution: isContribution,
      suggested_owner_name: isContribution && suggestedOwnerName.trim()
        ? suggestedOwnerName.trim() : undefined,
      suggested_owner_phone: isContribution && suggestedOwnerPhone.trim()
        ? suggestedOwnerPhone.trim() : undefined,
    });

    if (error) {
      showAlert('Error', error);
      return;
    }

    showAlert(
      isContribution ? '¡Contribución publicada!' : '¡Publicado!',
      isContribution
        ? 'Cuando el dueño se registre, le avisaremos que puede reclamar este alojamiento.'
        : 'Tu alojamiento ya está visible para todos.'
    );
    router.back();
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* ── Selector de modo: Para mí / Contribuir ── */}
      {!isEditing && (
      <View style={{
        borderRadius: 16,
        backgroundColor: tc.bgInput,
        borderWidth: 1,
        borderColor: tc.borderLight,
        padding: 4,
        marginBottom: 20,
      }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {/* Opción "Para mí" */}
          <TouchableOpacity
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              backgroundColor: !isContribution ? 'rgba(255,107,53,0.15)' : 'transparent',
              borderWidth: !isContribution ? 1 : 0,
              borderColor: !isContribution ? '#FF6B35' : 'transparent',
            }}
            onPress={() => setIsContribution(false)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <User size={18} color={!isContribution ? '#FF6B35' : tc.textMuted} />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: !isContribution ? '#FF6B35' : tc.textSecondary,
              }}>Para mí</Text>
            </View>
            <Text style={{
              fontSize: 10,
              color: !isContribution ? '#FF6B35' : tc.textMuted,
              marginTop: 2,
            }}>Publico lo mío</Text>
          </TouchableOpacity>

          {/* Opción "Contribuir" */}
          <TouchableOpacity
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              backgroundColor: isContribution ? 'rgba(139,92,246,0.15)' : 'transparent',
              borderWidth: isContribution ? 1 : 0,
              borderColor: isContribution ? '#8B5CF6' : 'transparent',
            }}
            onPress={() => setIsContribution(true)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Heart size={18} color={isContribution ? '#8B5CF6' : tc.textMuted} />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: isContribution ? '#8B5CF6' : tc.textSecondary,
              }}>Para otro</Text>
            </View>
            <Text style={{
              fontSize: 10,
              color: isContribution ? '#8B5CF6' : tc.textMuted,
              marginTop: 2,
            }}>Ayudo a alguien</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* ── Banner explicativo (solo contribución) ── */}
      {isContribution && (
        <View style={{
          backgroundColor: 'rgba(139,92,246,0.10)',
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.30)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 4,
        }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 16 }}>{"\u{1F49C}"}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>
              Contribución con Un Pique
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: tc.textSecondary, lineHeight: 18 }}>
            Estás publicando el alojamiento de otra persona. Si esa persona se registra, le avisaremos que puede reclamar este listado como suyo.
          </Text>
        </View>
      )}

      <Text style={[styles.stepTitle, { color: tc.text }]}>¿Qué tipo de alojamiento?</Text>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Nombre *</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
        placeholder="Ej: Hotel Paraíso, Cabañas del Lago..."
        placeholderTextColor={tc.textMuted}
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Tipo *</Text>
      <View style={styles.categoriesGrid}>
        {ACCOMMODATION_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.categoryChip,
              { backgroundColor: tc.bgInput, borderColor: tc.borderLight },
              accommodationType === type && { backgroundColor: tc.primary, borderColor: tc.primary },
            ]}
            onPress={() => setAccommodationType(type)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.categoryChipText,
              { color: tc.textSecondary },
              accommodationType === type && { color: '#fff' },
            ]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
        placeholder="Describí el alojamiento, qué incluye, su ubicación..."
        placeholderTextColor={tc.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={500}
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Imágenes (opcional, hasta 5)</Text>
      <TouchableOpacity
        style={[styles.imagePickerBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        onPress={async () => {
          try {
            const uris = await pickMultipleImages({ maxCount: 5, quality: 0.6 });
            if (uris.length > 0) setImageUris(uris);
          } catch (e) { /* user cancelled */ }
        }}
        activeOpacity={0.7}
      >
        <ImageIcon size={20} color={tc.textMuted} />
        <Text style={{ color: tc.textMuted, fontSize: 13 }}>
          {imageUris.length > 0 ? `${imageUris.length} imagen(es) seleccionada(s)` : 'Seleccionar fotos'}
        </Text>
      </TouchableOpacity>
      {imageUris.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
          {imageUris.map((uri, i) => (
            <View key={i} style={{ position: 'relative' }}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUris(prev => prev.filter((_, idx) => idx !== i))}
              >
                <X size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Campos del dueño real (solo contribución) ── */}
      {isContribution && (
        <View style={{
          backgroundColor: tc.bgCard,
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.30)',
          borderRadius: 14,
          padding: 16,
          marginTop: 8,
        }}>
          <Text style={{ fontSize: 13, color: '#8B5CF6', fontWeight: '700', marginBottom: 12 }}>
            Datos del dueño real (recomendado)
          </Text>
          <Text style={{ fontSize: 11, color: tc.textSecondary, marginBottom: 12 }}>
            Esto nos ayuda a conectarlos cuando se registre.
          </Text>

          <Text style={[styles.label, { color: tc.textSecondary, marginTop: 0 }]}>Nombre del dueño</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="Ej: Juan García"
            placeholderTextColor={tc.textMuted}
            value={suggestedOwnerName}
            onChangeText={setSuggestedOwnerName}
            maxLength={60}
          />

          <Text style={[styles.label, { color: tc.textSecondary }]}>Teléfono del dueño (para matching automático)</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="Ej: +5493821555555"
            placeholderTextColor={tc.textMuted}
            value={suggestedOwnerPhone}
            onChangeText={setSuggestedOwnerPhone}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <Text style={{ fontSize: 11, color: tc.textSecondary, marginTop: 8 }}>
            * Solo usamos estos datos para notificarle cuando se registre.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.text }]}>Detalles y contacto</Text>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Teléfono / WhatsApp *</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
        placeholder="Ej: +5493821555555"
        placeholderTextColor={tc.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={20}
      />

      {/* ── Sección Dirección con Geocoding ── */}
      <Text style={[styles.label, { color: tc.textSecondary }]}>Dirección / Calle</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
        placeholder="Ej: Av. San Martín, Ruta 38..."
        placeholderTextColor={tc.textMuted}
        value={addressStreet}
        onChangeText={(value) => {
          setAddressStreet(value);
          if (geoFound) {
            setGeoFound(false);
            setGeoError(false);
            setLatitude(null);
            setLongitude(null);
            mapFadeAnim.setValue(0);
          }
        }}
        maxLength={80}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Altura</Text>
      <TextInput
        style={[styles.input, {
          color: tc.text,
          backgroundColor: tc.bgInput,
          borderColor: tc.borderLight,
          width: isDesktop ? '40%' : '50%',
        }, webInputStyle]}
        placeholder="Ej: 1200"
        placeholderTextColor={tc.textMuted}
        value={addressNumber}
        onChangeText={(value) => {
          setAddressNumber(value);
          if (geoFound) {
            setGeoFound(false);
            setGeoError(false);
            setLatitude(null);
            setLongitude(null);
            mapFadeAnim.setValue(0);
          }
        }}
        keyboardType="default"
        maxLength={20}
      />

      {/* Localidad y Provincia */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>Localidad</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="Ej: Río Colorado"
            placeholderTextColor={tc.textMuted}
            value={addressLocality}
            onChangeText={(value) => {
              setAddressLocality(value);
              if (geoFound) {
                setGeoFound(false);
                setGeoError(false);
                setLatitude(null);
                setLongitude(null);
                mapFadeAnim.setValue(0);
              }
            }}
            maxLength={60}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>Provincia</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="Ej: Río Negro"
            placeholderTextColor={tc.textMuted}
            value={addressProvince}
            onChangeText={(value) => {
              setAddressProvince(value);
              if (geoFound) {
                setGeoFound(false);
                setGeoError(false);
                setLatitude(null);
                setLongitude(null);
                mapFadeAnim.setValue(0);
              }
            }}
            maxLength={60}
          />
        </View>
      </View>

      {/* Botón Buscar Dirección */}
      <TouchableOpacity
        style={[
          styles.searchAddressBtn,
          {
            backgroundColor: geocoding ? tc.bgInput : '#FF6B35',
            opacity: geocoding ? 0.7 : 1,
          },
          Platform.OS === 'web' ? {
            boxShadow: geocoding ? 'none' : '0 4px 14px rgba(255,107,53,0.3)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          } as any : !geocoding ? {
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          } : {},
        ]}
        onPress={geocodeAddress}
        disabled={geocoding || addressStreet.trim().length < 3}
        activeOpacity={0.85}
      >
        {geocoding ? (
          <ActivityIndicator size="small" color="#FF6B35" />
        ) : (
          <Search size={16} color="#fff" />
        )}
        <Text style={{
          color: geocoding ? tc.textSecondary : '#fff',
          fontSize: 14,
          fontWeight: '700',
        }}>
          {geocoding ? 'Buscando...' : 'Buscar dirección'}
        </Text>
      </TouchableOpacity>

      {/* Estado: Éxito con coordenadas */}
      {!geocoding && geoFound && latitude !== null && longitude !== null && (
        <View style={styles.geoResultContainer}>
          <View style={styles.geoSuccessRow}>
            <CheckCircle size={15} color="#22C55E" />
            <Text style={[styles.geoSuccessText, { color: '#22C55E' }]}>
              Ubicación encontrada
            </Text>
          </View>
          <View style={styles.coordsBadgeRow}>
            <View style={[styles.coordBadge, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
              <MapPin size={11} color="#FF6B35" />
              <Text style={[styles.coordText, { color: tc.textSecondary }]}>
                {latitude.toFixed(5)}
              </Text>
            </View>
            <View style={[styles.coordBadge, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
              <MapPin size={11} color="#FF6B35" />
              <Text style={[styles.coordText, { color: tc.textSecondary }]}>
                {longitude.toFixed(5)}
              </Text>
            </View>
          </View>

          {/* Mapa miniatura */}
          <Animated.View style={{ opacity: mapFadeAnim, marginTop: 12 }}>
            <AddressMapPreview
              latitude={latitude}
              longitude={longitude}
              title={title || 'Alojamiento'}
              onPress={() => setShowMapModal(true)}
              backgroundColor={tc.bgInput}
              borderColor={tc.borderLight}
              textColor={tc.text}
              textMuted={tc.textSecondary}
            />
          </Animated.View>

          {/* Modal mapa expandido */}
          <MapExpandedModal
            visible={showMapModal}
            onClose={() => setShowMapModal(false)}
            latitude={latitude}
            longitude={longitude}
            title={title || 'Alojamiento'}
            address={getFullAddress()}
            backgroundColor={tc.bgCard}
            textColor={tc.text}
            textSecondary={tc.textSecondary}
            borderColor={tc.borderLight}
          />
        </View>
      )}

      {/* Estado: Error */}
      {!geocoding && geoError && (
        <View style={styles.geoErrorRow}>
          <AlertCircle size={14} color="#F59E0B" />
          <Text style={[styles.geoErrorText, { color: tc.textSecondary }]}>
            No se encontró la dirección. Podés continuar igual.
          </Text>
        </View>
      )}

      <Text style={[styles.label, { color: tc.textSecondary }]}>Capacidad máxima (personas)</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
        placeholder="Ej: 4"
        placeholderTextColor={tc.textMuted}
        value={maxGuests}
        onChangeText={setMaxGuests}
        keyboardType="numeric"
        maxLength={3}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Precio por noche (opcional)</Text>
      <View style={{ flexDirection: 'row', backgroundColor: tc.bgInput, borderRadius: 12, paddingHorizontal: 14, height: 48, alignItems: 'center', borderColor: tc.borderLight, borderWidth: 1 }}>
        <Text style={{ fontSize: 15, color: tc.textSecondary, marginRight: 4 }}>$</Text>
        <TextInput
          style={[{ flex: 1, fontSize: 15, color: tc.text }, webInputStyle]}
          placeholder="Ej: 15000"
          placeholderTextColor={tc.textMuted}
          value={pricePerNight}
          onChangeText={setPricePerNight}
          keyboardType="numeric"
        />
        <Text style={{ fontSize: 13, color: tc.textSecondary }}>ARS</Text>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>Check-in</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="14:00"
            placeholderTextColor={tc.textMuted}
            value={checkIn}
            onChangeText={setCheckIn}
            maxLength={5}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={[styles.label, { color: tc.textSecondary }]}>Check-out</Text>
          <TextInput
            style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }, webInputStyle]}
            placeholder="10:00"
            placeholderTextColor={tc.textMuted}
            value={checkOut}
            onChangeText={setCheckOut}
            maxLength={5}
          />
        </View>
      </View>

      {AMENITIES_CATEGORIES.map((category) => (
        <View key={category.name} style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: tc.textSecondary, marginBottom: 8 }]}>{category.name}</Text>
          <View style={styles.amenitiesGrid}>
            {category.items.map((item) => {
              const selected = amenities.includes(item.key);
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.amenityChip,
                    { backgroundColor: tc.bgInput, borderColor: tc.borderLight },
                    selected && { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
                  ]}
                  onPress={() => toggleAmenity(item.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.amenityText,
                    { color: tc.textSecondary },
                    selected && { color: '#fff' },
                  ]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    // Corrección de Safe Area: Se limita el área segura solo a la parte superior ('top')
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
          <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
            <ArrowLeft size={22} color={tc.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.text }]}>{isContribution ? (isEditing ? 'Editar contribución' : 'Contribuir con Un Pique') : (isEditing ? 'Editar alojamiento' : 'Publicar alojamiento')}</Text>
          <Text style={[styles.stepIndicator, { color: tc.textMuted }]}>Paso {step}/2</Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: tc.bgInput }]}>
          <View style={[styles.progressFill, { backgroundColor: tc.primary, width: step === 1 ? '50%' : '100%' }]} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>

        {/* Footer buttons */}
        <View style={[styles.footer, { borderTopColor: tc.borderLight, backgroundColor: tc.bg }]}>
          {step === 2 && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: tc.borderLight }]}
              onPress={() => setStep(1)}
            >
              <ChevronLeft size={18} color={tc.textSecondary} />
              <Text style={[styles.secondaryBtnText, { color: tc.textSecondary }]}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: canGoNext ? tc.primary : tc.bgInput },
              step === 1 && { flex: 1 },
            ]}
            onPress={() => {
              if (step === 1) setStep(2);
              else handleSubmit();
            }}
            disabled={!canGoNext || saving || uploadingImages}
            activeOpacity={0.8}
          >
            {saving || uploadingImages ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={[styles.primaryBtnText, { color: canGoNext ? '#fff' : tc.textMuted }]}>
                  {step === 1 ? 'Siguiente' : isEditing ? 'Guardar' : 'Publicar'}
                </Text>
                {step === 1 ? (
                  <ChevronRight size={18} color={canGoNext ? '#fff' : tc.textMuted} />
                ) : (
                  <Check size={18} color={canGoNext ? '#fff' : tc.textMuted} />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  stepIndicator: { fontSize: 13, fontWeight: '600' },
  progressBar: { height: 3, width: '100%' },
  progressFill: { height: '100%', borderRadius: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepContent: { gap: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    fontSize: 15, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  geoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  geoStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  geoHintText: {
    fontSize: 11,
    marginTop: 8,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  amenityText: { fontSize: 13, fontWeight: '600' },
  footer: {
    flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, gap: 6,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800' },
  imagePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
  },
  imagePreview: { width: 80, height: 80, borderRadius: 10 },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#e53e3e',
    justifyContent: 'center', alignItems: 'center',
  },
  searchAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  geoResultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  geoSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  geoSuccessText: {
    fontSize: 14,
    fontWeight: '700',
  },
  coordsBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  coordText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  geoErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  geoErrorText: {
    fontSize: 13,
    flex: 1,
  },
});
