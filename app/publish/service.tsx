// Publicar Servicio — formulario de 2 pasos
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, ChevronDown, ImageIcon, X } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useListingStore } from '../../stores/listingStore';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../utils/alert';
import { pickMultipleImages, uploadImage } from '../../services/imageUpload';
import { supabase } from '../../lib/supabase';

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
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { createListing, saving } = useListingStore();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;
  const isEditing = !!editId;

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Pre-load data for edit mode
  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    const load = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', editId).single();
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setHourlyRate(data.hourly_rate ? String(data.hourly_rate) : '');
        if (data.images && data.images.length > 0) setImageUris(data.images);
      }
      setLoadingEdit(false);
    };
    load();
  }, [editId]);

  const canGoNext = step === 1
    ? title.trim().length > 0 && category.length > 0
    : phone.trim().length > 0;

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
            const result = await uploadImage(uri, 'listings', 'services', { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
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
          category,
          description: description.trim(),
          phone: phone.trim(),
          address: address.trim(),
          hourly_rate: hourlyRate ? parseInt(hourlyRate, 10) : null,
          images: uploadedUrls,
        })
        .eq('id', editId);

      if (updateError) {
        showAlert('Error', updateError.message);
        return;
      }
      showAlert('¡Actualizado!', 'Tu servicio fue actualizado correctamente.');
      router.back();
      return;
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

      {/* Category dropdown trigger */}
      <TouchableOpacity
        style={[styles.input, {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: tc.bgInput,
          borderColor: tc.borderLight,
        }]}
        onPress={() => setCategoryModalVisible(true)}
      >
        <Text style={{ color: category ? tc.text : tc.textMuted, fontSize: 15 }}>
          {category || 'Seleccioná una categoría...'}
        </Text>
        <ChevronDown size={18} color={tc.textMuted} />
      </TouchableOpacity>

      {/* Category modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: tc.bgCard,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '70%',
          }}>
            {/* Handle */}
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: tc.borderLight,
              alignSelf: 'center', marginTop: 12, marginBottom: 8,
            }} />
            <Text style={{
              fontSize: 17, fontWeight: '700',
              color: tc.text, textAlign: 'center',
              paddingBottom: 16, borderBottomWidth: 1,
              borderBottomColor: tc.borderLight,
            }}>
              Categoría del servicio
            </Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: tc.borderLight,
                  }}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={{
                    fontSize: 15,
                    color: category === cat ? '#FF6B35' : tc.text,
                    fontWeight: category === cat ? '700' : '400',
                  }}>
                    {cat}
                  </Text>
                  {category === cat && (
                    <Check size={18} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
          <Text style={[styles.headerTitle, { color: tc.text }]}>{isEditing ? 'Editar servicio' : 'Publicar servicio'}</Text>
          <Text style={[styles.stepIndicator, { color: tc.textMuted }]}>Paso {step}/2</Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: tc.bgInput }]}>
          <View style={[styles.progressFill, { backgroundColor: '#FF6B35', width: step === 1 ? '50%' : '100%' }]} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>

        {/* Floating footer buttons */}
        <View style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom + 10, 20),
          left: 20,
          right: 20,
          flexDirection: 'row',
          gap: 12,
          zIndex: 20,
        }}>
          {step === 2 && (
            <TouchableOpacity
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 50,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: tc.borderLight,
                  backgroundColor: tc.bgCard,
                },
                Platform.OS === 'web' ? {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                } as any : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
              onPress={() => setStep(1)}
            >
              <ChevronLeft size={18} color={tc.textSecondary} />
              <Text style={{ color: tc.textSecondary, fontWeight: '700', fontSize: 15 }}>
                Atrás
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                borderRadius: 50,
                gap: 6,
                backgroundColor: canGoNext ? '#FF6B35' : tc.bgInput,
              },
              canGoNext && Platform.OS === 'web' ? {
                boxShadow: '0 6px 20px rgba(255,107,53,0.4)',
              } as any : canGoNext ? {
                shadowColor: '#FF6B35',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 10,
              } : {},
            ]}
            onPress={() => {
              if (step === 1) setStep(2);
              else handleSubmit();
            }}
            disabled={!canGoNext || saving || uploadingImages}
            activeOpacity={0.85}
          >
            {saving || uploadingImages ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{
                  color: canGoNext ? '#fff' : tc.textMuted,
                  fontSize: 15,
                  fontWeight: '800',
                }}>
                  {step === 1 ? 'Siguiente' : isEditing ? 'Guardar' : 'Publicar'}
                </Text>
                {step === 1
                  ? <ChevronRight size={18} color={canGoNext ? '#fff' : tc.textMuted} />
                  : <Check size={18} color={canGoNext ? '#fff' : tc.textMuted} />
                }
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
  scrollContent: { padding: 20, paddingBottom: 120 },
  stepContent: { gap: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    fontSize: 15, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
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
