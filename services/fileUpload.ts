import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';

export async function pickAndUploadFile(bucket = 'chats', folder = 'files'):
  Promise<{ url: string; name: string; mimeType: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = result.assets[0];
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
  const filePath = `audio/${Date.now()}.m4a`;
  const { error } = await supabase.storage
    .from('chats').upload(filePath, blob, { contentType: 'audio/m4a' });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('chats').getPublicUrl(filePath);
  return urlData.publicUrl;
}
