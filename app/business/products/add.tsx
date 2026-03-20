// Formulario de producto — Con persistencia real y upload de imagen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import { useThemeColors } from '../../../hooks/useThemeColors';
import colors from '../../../constants/colors';
import { showAlert } from '../../../utils/alert';
import { useProductStore } from '../../../stores/productStore';
import { useBusinessStore } from '../../../stores/businessStore';
import { pickImage } from '../../../services/imageUpload';

export default function AddProductScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { createProduct, saving } = useProductStore();
    const { selectedBusiness } = useBusinessStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    const handlePickImage = async () => {
        try {
            const uri = await pickImage({ aspect: [4, 3], quality: 0.7 });
            if (uri) setImageUri(uri);
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo seleccionar la imagen');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Error', 'El nombre del producto es obligatorio');
            return;
        }
        if (!price.trim() || parseFloat(price) <= 0) {
            showAlert('Error', 'Ingresá un precio válido');
            return;
        }
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        const success = await createProduct(
            selectedBusiness.id,
            {
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
            },
            imageUri || undefined
        );

        if (success) {
            showAlert('¡Listo!', 'Producto guardado correctamente');
            router.back();
        } else {
            showAlert('Error', 'No se pudo guardar el producto. Revisá la conexión.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Añadir Producto</Text>
                    <View style={{ width: 36 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                {/* Imagen */}
                <TouchableOpacity
                    style={[styles.imageUpload, { borderColor: tc.borderLight, backgroundColor: tc.bgCard }]}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                >
                    {imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setImageUri(null)}
                            >
                                <X size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Camera size={28} color={tc.textMuted} />
                            <Text style={[styles.uploadTitle, { color: tc.text }]}>Subir Imagen</Text>
                            <Text style={[styles.uploadSub, { color: tc.textMuted }]}>Tocá para seleccionar</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Campos */}
                <View style={styles.fields}>
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: tc.text }]}>Nombre del Producto</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                            placeholder="Ej: Tarta de Queso Casera"
                            placeholderTextColor={tc.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: tc.text }]}>Descripción</Text>
                        <TextInput
                            style={[styles.textarea, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                            placeholder="Describí tu producto..."
                            placeholderTextColor={tc.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={[styles.label, { color: tc.text }]}>Precio ($)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                placeholder="0.00"
                                placeholderTextColor={tc.textMuted}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={[styles.label, { color: tc.text }]}>Stock</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                placeholder="Ej: 10"
                                placeholderTextColor={tc.textMuted}
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Botones */}
            <SafeAreaView edges={['bottom']}>
                <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>Guardar Producto</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                        <Text style={[styles.cancelBtnText, { color: colors.primary.DEFAULT }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },
    form: { padding: 16, gap: 16, paddingBottom: 24 },
    imageUpload: {
        borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
        padding: 24, alignItems: 'center', gap: 6,
    },
    uploadTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans' },
    uploadSub: { fontSize: 12, fontFamily: 'Nunito Sans' },
    imagePreviewContainer: { position: 'relative', width: '100%', alignItems: 'center' },
    imagePreview: { width: 200, height: 150, borderRadius: 10 },
    removeImageBtn: {
        position: 'absolute', top: -8, right: 40,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    },
    fields: { gap: 14 },
    field: { gap: 6 },
    label: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Nunito Sans' },
    textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Nunito Sans', minHeight: 100 },
    row: { flexDirection: 'row', gap: 12 },
    footer: { padding: 16, gap: 10, borderTopWidth: 1 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 14, borderRadius: 9999, alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    cancelBtn: { paddingVertical: 12, borderRadius: 9999, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans' },
});
