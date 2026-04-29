// Servicio de carga de imágenes — Compresión + Supabase Storage
// Compatible con Web, iOS y Android
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type StorageBucket = 'avatars' | 'products' | 'businesses' | 'listings' | 'posts' | 'stories' | 'covers';

interface UploadResult {
    url: string;
    path: string;
}

/**
 * Abre el selector de imágenes con compresión
 * En web no necesita permisos, usa input file nativo
 */
export async function pickImage(options?: {
    aspect?: [number, number];
    quality?: number;
    maxWidth?: number;
}): Promise<string | null> {
    try {
        // En web, no pedir permisos (usa el file picker nativo del browser)
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Se necesita permiso para acceder a la galería');
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: options?.aspect || [1, 1],
            quality: options?.quality || 0.6,
        });

        if (result.canceled || !result.assets?.[0]) {
            return null;
        }

        return result.assets[0].uri;
    } catch (error) {
        console.error('Error al seleccionar imagen:', error);
        throw error;
    }
}

/**
 * Abre el selector de múltiples imágenes con compresión
 */
export async function pickMultipleImages(options?: {
    maxCount?: number;
    quality?: number;
}): Promise<string[]> {
    try {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Se necesita permiso para acceder a la galería');
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: options?.maxCount || 5,
            quality: options?.quality || 0.6,
        });

        if (result.canceled || !result.assets) {
            return [];
        }

        return result.assets.map(a => a.uri);
    } catch (error) {
        console.error('Error al seleccionar imágenes:', error);
        throw error;
    }
}

/**
 * Procesa una imagen antes de subirla: redimensiona y comprime
 * Solo se aplica en iOS/Android. En web se salta.
 */
async function processImageBeforeUpload(
    uri: string,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
    if (Platform.OS === 'web') return uri;
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = options;
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth, height: maxHeight } }],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.warn('Image processing failed, using original:', error);
        return uri;
    }
}

/**
 * Sube una imagen a Supabase Storage
 * Funciona correctamente en Web, iOS y Android
 * Comprime automáticamente en móvil antes de subir
 */
export async function uploadImage(
    uri: string,
    bucket: StorageBucket,
    folder?: string,
    options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<UploadResult> {
    try {
        const processedUri = await processImageBeforeUpload(uri, options);
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let uploadData: any;
        let finalMimeType = 'image/jpeg';
        let ext = 'jpg';

        if (Platform.OS === 'web') {
            const response = await fetch(processedUri);
            const blob = await response.blob();
            finalMimeType = blob.type || 'image/jpeg';
            ext = finalMimeType === 'image/png' ? 'png' : 'jpg';
            uploadData = new File([blob], `imagen-${uniqueId}.${ext}`, { type: finalMimeType });
        } else {
            const response = await fetch(processedUri);
            const blob = await response.blob();
            uploadData = await new Response(blob).arrayBuffer();
            finalMimeType = 'image/jpeg';
            ext = 'jpg';
        }

        const fileName = `imagen-${uniqueId}.${ext}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, uploadData, {
                contentType: finalMimeType,
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            url: urlData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

/**
 * Elimina una imagen de Supabase Storage
 */
export async function deleteImage(
    bucket: StorageBucket,
    path: string
): Promise<void> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
    }
}

/**
 * Selecciona y sube una imagen en un solo paso
 */
export async function pickAndUploadImage(
    bucket: StorageBucket,
    folder?: string,
    options?: { aspect?: [number, number]; quality?: number }
): Promise<UploadResult | null> {
    const uri = await pickImage(options);
    if (!uri) return null;

    return await uploadImage(uri, bucket, folder);
}

/**
 * Selecciona y sube múltiples imágenes
 */
export async function pickAndUploadMultipleImages(
    bucket: StorageBucket,
    folder?: string,
    options?: { maxCount?: number; quality?: number }
): Promise<UploadResult[]> {
    const uris = await pickMultipleImages(options);
    if (uris.length === 0) return [];

    const results: UploadResult[] = [];
    for (const uri of uris) {
        const result = await uploadImage(uri, bucket, folder);
        results.push(result);
    }
    return results;
}
