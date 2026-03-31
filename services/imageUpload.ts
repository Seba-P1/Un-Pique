// Servicio de carga de imágenes — Compresión + Supabase Storage
// Compatible con Web, iOS y Android
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type StorageBucket = 'avatars' | 'products' | 'businesses' | 'listings';

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
 * Converts a URI to an ArrayBuffer for upload (works on Web and Native)
 */
async function uriToArrayBuffer(uri: string): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
    if (Platform.OS === 'web') {
        // On web, the URI is a blob URL or data URL
        const response = await fetch(uri);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        return { buffer, mimeType: blob.type || 'image/jpeg' };
    } else {
        // On native, fetch the URI
        const response = await fetch(uri);
        const blob = await response.blob();
        const buffer = await new Response(blob).arrayBuffer();
        return { buffer, mimeType: 'image/jpeg' };
    }
}

/**
 * Sube una imagen a Supabase Storage
 * Funciona correctamente en Web, iOS y Android
 */
export async function uploadImage(
    uri: string,
    bucket: StorageBucket,
    folder?: string
): Promise<UploadResult> {
    try {
        const { buffer, mimeType } = await uriToArrayBuffer(uri);

        // Generate unique filename
        const ext = mimeType === 'image/png' ? 'png' : 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: mimeType,
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
