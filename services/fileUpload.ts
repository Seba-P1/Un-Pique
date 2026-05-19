import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';

export async function pickAndUploadFile(bucket = 'chats', folder = 'files'):
  Promise<{ url: string; name: string; mimeType: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = result.assets[0];

  // Validar tamaño (máx 20MB para archivos de chat)
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo es demasiado grande. Máximo 20MB.`);
  }

  // Validar tipo (solo documentos y audio)
  const ALLOWED_TYPES = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'audio/m4a', 'audio/mp4', 'audio/mpeg'
  ];
  if (file.mimeType && !ALLOWED_TYPES.includes(file.mimeType)) {
      throw new Error(`Tipo de archivo no permitido: ${file.mimeType}`);
  }

  const response = await fetch(file.uri);
  const blob = await response.blob();
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket).upload(filePath, blob, { contentType: file.mimeType || 'application/octet-stream' });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { url: urlData.publicUrl, name: file.name, mimeType: file.mimeType || '' };
}

export async function uploadAudioFile(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Validar tamaño (máx 10MB para audios)
  const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
  if (blob.size > MAX_AUDIO_SIZE) {
      throw new Error('El audio es demasiado largo. Máximo 10MB.');
  }

  const filePath = `audio/${Date.now()}.m4a`;
  const { error } = await supabase.storage
    .from('chats').upload(filePath, blob, { contentType: 'audio/m4a' });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('chats').getPublicUrl(filePath);
  return urlData.publicUrl;
}
