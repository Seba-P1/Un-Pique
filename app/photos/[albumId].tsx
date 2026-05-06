import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator,
  useWindowDimensions, SafeAreaView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, FolderOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../hooks/useThemeColors';
import { usePhotosStore, UserPhoto } from '../../stores/photosStore';
import { useAuthStore } from '../../stores/authStore';
import { pickImage } from '../../services/imageUpload';
import { PhotoMenuModal, LightboxModal } from '../../components/profile/PhotosView';
import { supabase } from '../../lib/supabase';

export default function AlbumViewScreen() {
  const params = useLocalSearchParams();
  const albumId = params.albumId as string;
  const albumName = params.name as string;
  const ownerId = params.ownerId as string | undefined;

  const tc = useThemeColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;

  const numCols = isDesktop ? 4 : 3;
  const cellSize = Math.floor(width / numCols);

  const { user } = useAuthStore();
  const { fetchAlbumPhotos, uploadStandalonePhoto, albums } = usePhotosStore();

  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [showAlbumSelector, setShowAlbumSelector] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const load = async () => {
    setLoading(true);
    
    // BUG 1 FIXED: Securely check ownership against DB
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: album } = await supabase.from('photo_albums').select('user_id').eq('id', albumId).single();
      setIsOwner(authUser.id === album?.user_id);
    }
    
    const result = await fetchAlbumPhotos(albumId);
    setPhotos(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [albumId]);

  const handleUploadToAlbum = async () => {
    const uri = await pickImage({ aspect: [1, 1], quality: 0.8 });
    if (!uri) return;
    const photo = await uploadStandalonePhoto(uri, albumId);
    if (photo) setPhotos(prev => [photo, ...prev]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tc.bg }}>
      {/* HEADER */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderColor: tc.borderLight,
        backgroundColor: tc.bgCard
      }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, justifyContent: 'center' }}
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/profile' as any)}
        >
          <ChevronLeft size={24} color={tc.text} />
        </TouchableOpacity>
        
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: tc.text, flex: 1, textAlign: 'center' }}>
          {albumName}
        </Text>

        <View style={{ width: 40, alignItems: 'flex-end', justifyContent: 'center' }}>
          {isOwner && (
            <TouchableOpacity onPress={handleUploadToAlbum}>
              <Plus size={22} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* GRID */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#FF6B35" size="large" />
        </View>
      ) : photos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <FolderOpen size={48} color={tc.borderLight} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text, marginTop: 12 }}>
            Este álbum está vacío
          </Text>
          {isOwner && (
            <Text style={{ fontSize: 13, color: tc.textSecondary, marginTop: 6 }}>
              Tocá + para agregar fotos
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          key={`photos-grid-${numCols}`}
          numColumns={numCols}
          data={photos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={{ width: cellSize, height: cellSize }}
              onPress={() => isOwner ? setSelectedPhoto(item) : setFullscreenPhoto(item.url)}
            >
              <Image
                source={{ uri: item.url }}
                style={{ width: cellSize, height: cellSize }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          columnWrapperStyle={{ gap: 2 }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* MODALS */}
      <PhotoMenuModal
        visible={!!selectedPhoto && isOwner && !showAlbumSelector}
        selectedPhoto={selectedPhoto}
        onClose={() => { setSelectedPhoto(null); load(); }}
        onFullscreen={(url) => { setFullscreenPhoto(url); setSelectedPhoto(null); }}
        showAlbumSelector={showAlbumSelector}
        setShowAlbumSelector={setShowAlbumSelector}
        albums={albums}
        userId={user?.id || ''}
      />

      <LightboxModal
        fullscreenPhoto={fullscreenPhoto}
        onClose={() => setFullscreenPhoto(null)}
      />
    </SafeAreaView>
  );
}
