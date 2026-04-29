// Publicar Servicio — formulario de 2 pasos
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, ImageIcon, X } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useListingStore } from '../../stores/listingStore';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';
import { pickMultipleImages, uploadImage } from '../../services/imageUpload';

const SERVICE_CATEGORIES = [
  'Plomería', 'Electricidad', 'Mecánica', 'Pintura', 'Albañilería',
  'Fletes', 'Peluquería', 'Salud', 'Fotografía', 'Clases',
  'Niñera', 'Mascotas', 'Lavadero', 'Internet/PC', 'Seguridad',
  'Chef a domicilio', 'Personal Trainer', 'Música', 'Jardinería',
  'Cuidado personal', 'Otro',
];

export default function PublishServiceScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { createListing, saving } = useListingStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const canGoNext = step === 1
    ? title.trim().length > 0 && category.length > 0
    : phone.trim().length > 0;

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Error', 'Necesitás estar logueado para publicar.');
      return;
    }

    // Subir imágenes si hay
    let uploadedUrls: string[] = [];
    if (imageUris.length > 0) {
      setUploadingImages(true);
      try {
        for (const uri of imageUris) {
          const result = await uploadImage(uri, 'listings', 'services', { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
          uploadedUrls.push(result.url);
        }
      } catch (err) {
        showAlert('Error', 'No se pudieron subir las imágenes. Intentá de nuevo.');
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    const { data, error } = await createListing({
      type: 'service',
      title: title.trim(),
      category,
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      hourly_rate: hourlyRate ? parseInt(hourlyRate, 10) : undefined,
      images: uploadedUrls,
      amenities: [],
    });

    if (error) {
      showAlert('Error', error);
      return;
    }

    showAlert('¡Publicado!', 'Tu servicio ya está visible para todos.');
    router.back();
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.text }]}>¿Qué servicio ofrecés?</Text>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Nombre del servicio *</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        placeholder="Ej: Plomería García, Clases de guitarra..."
        placeholderTextColor={tc.textMuted}
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Categoría *</Text>
      <View style={styles.categoriesGrid}>
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              { backgroundColor: tc.bgInput, borderColor: tc.borderLight },
              category === cat && { backgroundColor: tc.primary, borderColor: tc.primary },
            ]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.categoryChipText,
              { color: tc.textSecondary },
              category === cat && { color: '#fff' },
            ]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        placeholder="Contá qué hacés, tu experiencia, zona de cobertura..."
        placeholderTextColor={tc.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={500}
        textAlignVertical="top"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: tc.text }]}>Datos de contacto</Text>

      <Text style={[styles.label, { color: tc.textSecondary }]}>Teléfono / WhatsApp *</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        placeholder="Ej: +5493821555555"
        placeholderTextColor={tc.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={20}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Dirección / Zona</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        placeholder="Ej: Barrio Centro, Av. San Martín 1200"
        placeholderTextColor={tc.textMuted}
        value={address}
        onChangeText={setAddress}
        maxLength={100}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Tarifa por hora (opcional)</Text>
      <TextInput
        style={[styles.input, { color: tc.text, backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        placeholder="Ej: 2500"
        placeholderTextColor={tc.textMuted}
        value={hourlyRate}
        onChangeText={setHourlyRate}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={[styles.label, { color: tc.textSecondary }]}>Imágenes (opcional, hasta 3)</Text>
      <TouchableOpacity
        style={[styles.imagePickerBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
        onPress={async () => {
          try {
            const uris = await pickMultipleImages({ maxCount: 3, quality: 0.6 });
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
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
          <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
            <ArrowLeft size={22} color={tc.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Publicar servicio</Text>
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
                  {step === 1 ? 'Siguiente' : 'Publicar'}
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
  textArea: { height: 100, textAlignVertical: 'top' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
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
});
