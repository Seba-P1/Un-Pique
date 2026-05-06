import React, { useState, useEffect, useRef } from 'react';
import {
  Animated, Modal, FlatList, ScrollView, Alert, Platform,
  TextInput, TouchableOpacity, View, Text, Image, ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Camera, FolderOpen, FolderPlus, MoreVertical, Plus, Trash2,
  User, Image as ImageIcon, Share2, X, Edit2, ChevronRight
} from 'lucide-react-native';

import { usePhotosStore, UserPhoto, PhotoAlbum } from '../../stores/photosStore';
import { useAuthStore } from '../../stores/authStore';
import { pickImage } from '../../services/imageUpload';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showToast } from '../../utils/toast';
import { supabase } from '../../lib/supabase';

interface Props {
  userId: string;
  isOwner: boolean;
}

export default function PhotosView({ userId, isOwner }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showAddAlbumInput, setShowAddAlbumInput] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showAlbumSelector, setShowAlbumSelector] = useState(false);
  
  const tc = useThemeColors();
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;

  // Grid de fotos
  const numCols = isDesktop ? 4 : 3;
  const cellSize = Math.floor(width / numCols);

  // Grid de álbumes
  const numColsAlbums = isDesktop ? 3 : 2;
  const albumCardWidth = Math.floor((width - 32 - (numColsAlbums - 1) * 12) / numColsAlbums);

  const {
    allPhotos, albums, loading, saving,
    fetchUserPhotos, fetchAlbumPhotos,
    createAlbum, renameAlbum, deleteAlbum,
    uploadStandalonePhoto, deletePhoto,
    setAsAvatar, setAsBanner
  } = usePhotosStore();

  useEffect(() => {
    fetchUserPhotos(userId);
  }, [userId]);

  const handleUploadPhoto = async () => {
    const uri = await pickImage({ aspect: [1, 1], quality: 0.8 });
    if (!uri) return;
    await uploadStandalonePhoto(uri);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    await createAlbum(newAlbumName.trim());
    setNewAlbumName('');
    setShowAddAlbumInput(false);
    showToast.success('Álbum creado');
  };

  // Add album input animation
  const addAlbumAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(addAlbumAnim, {
      toValue: showAddAlbumInput ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showAddAlbumInput]);

  // Photo grid animation
  const photoAnims = useRef<{ [id: string]: Animated.Value }>({}).current;
  useEffect(() => {
    allPhotos.forEach((photo, i) => {
      if (!photoAnims[photo.id]) {
        photoAnims[photo.id] = new Animated.Value(0);
        Animated.timing(photoAnims[photo.id], {
          toValue: 1,
          duration: 150,
          delay: Math.min(i, 30) * 15,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [allPhotos]);

  return (
    <ScrollView
      contentContainerStyle={{
        maxWidth: isDesktop ? 1100 : undefined,
        alignSelf: 'center',
        width: '100%',
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* SECCIÓN "TODAS LAS FOTOS" */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text }}>Todas las fotos</Text>
        <Text style={{ fontSize: 13, color: tc.textSecondary, marginLeft: 6, flex: 1 }}>({allPhotos.length})</Text>
        {isOwner && saving && <ActivityIndicator size="small" color="#FF6B35" />}
        {isOwner && !saving && (
          <TouchableOpacity onPress={handleUploadPhoto}>
            <Plus size={22} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>

      {loading && allPhotos.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color="#FF6B35" />
        </View>
      ) : allPhotos.length === 0 ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ImageIcon size={40} color={tc.borderLight} />
          <Text style={{ fontSize: 15, color: tc.textSecondary, marginTop: 10 }}>No hay fotos todavía</Text>
          {isOwner && (
            <Text style={{ fontSize: 13, color: tc.textSecondary, marginTop: 4 }}>Tocá + para subir tu primera foto</Text>
          )}
        </View>
      ) : (
        <FlatList
          key={`photos-grid-${numCols}`}
          numColumns={numCols}
          data={allPhotos}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <Animated.View style={{ opacity: photoAnims[item.id] || 0 }}>
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
                {item.source === 'avatar' && (
                  <View style={{
                    position: 'absolute', top: 4, left: 4,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    justifyContent: 'center', alignItems: 'center'
                  }}>
                    <User size={10} color="#fff" />
                  </View>
                )}
                {item.source === 'cover' && (
                  <View style={{
                    position: 'absolute', top: 4, left: 4,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    justifyContent: 'center', alignItems: 'center'
                  }}>
                    <ImageIcon size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          columnWrapperStyle={{ gap: 2 }}
        />
      )}

      {/* SECCIÓN "ÁLBUMES" */}
      <View style={{ height: 1, backgroundColor: tc.borderLight, marginHorizontal: 16, marginTop: 24, marginBottom: 20 }} />
      
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text, flex: 1 }}>Álbumes</Text>
        {isOwner && (
          <TouchableOpacity onPress={() => setShowAddAlbumInput(prev => !prev)}>
            <FolderPlus size={22} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={{
        height: addAlbumAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }),
        opacity: addAlbumAnim,
        overflow: 'hidden'
      }}>
        <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={[{
              flex: 1, height: 44, backgroundColor: tc.bgInput, borderRadius: 10,
              paddingHorizontal: 12, fontSize: 14, color: tc.text
            }, Platform.OS === 'web' && { outline: 'none', outlineWidth: 0 } as any]}
            placeholder="Nombre del álbum"
            placeholderTextColor={tc.textSecondary}
            value={newAlbumName}
            onChangeText={setNewAlbumName}
            autoFocus={true}
            onSubmitEditing={handleCreateAlbum}
          />
          <TouchableOpacity
            style={{ backgroundColor: '#FF6B35', height: 44, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}
            onPress={handleCreateAlbum}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Crear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => { setShowAddAlbumInput(false); setNewAlbumName(''); }}
          >
            <X size={18} color={tc.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {albums.length === 0 && !showAddAlbumInput ? (
        <View style={{ paddingVertical: 24, marginHorizontal: 16, alignItems: 'center' }}>
          <FolderOpen size={36} color={tc.borderLight} />
          <Text style={{ fontSize: 14, color: tc.textSecondary, marginTop: 8 }}>
            {isOwner ? 'No tenés álbumes todavía' : 'No hay álbumes todavía'}
          </Text>
          {isOwner && (
            <Text style={{ fontSize: 12, color: tc.textSecondary, marginTop: 4 }}>Tocá el ícono para crear uno</Text>
          )}
        </View>
      ) : (
        <FlatList
          key={`albums-grid-${numColsAlbums}`}
          numColumns={numColsAlbums}
          data={albums}
          scrollEnabled={false}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          columnWrapperStyle={numColsAlbums > 1 ? { gap: 12 } : undefined}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                width: albumCardWidth,
                borderRadius: 14, overflow: 'hidden',
                backgroundColor: tc.bgCard, borderColor: tc.borderLight, borderWidth: 1,
                marginBottom: 12
              }}
              onPress={() => router.push({ pathname: '/photos/[albumId]', params: { albumId: item.id, name: item.name } } as any)}
            >
              <View style={{ height: albumCardWidth * 0.75, width: '100%' }}>
                {item.cover_photo_url ? (
                  <Image source={{ uri: item.cover_photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: tc.bgInput, justifyContent: 'center', alignItems: 'center' }}>
                    <FolderOpen size={28} color={tc.textSecondary} />
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: tc.text }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: tc.textSecondary, marginTop: 1 }}>{item.photos_count} fotos</Text>
                </View>
                {isOwner && (
                  <View onStartShouldSetResponder={() => true} onTouchEnd={(e) => { e.stopPropagation(); setSelectedAlbum(item); setShowAlbumModal(true); }}>
                    <TouchableOpacity
                      style={{ padding: 4 }}
                      onPress={(e) => { e.stopPropagation(); setSelectedAlbum(item); setShowAlbumModal(true); }}
                    >
                      <MoreVertical size={16} color={tc.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODALS */}

      {/* Photo Menu Modal */}
      <PhotoMenuModal
        visible={!!selectedPhoto && isOwner && !showAlbumSelector}
        selectedPhoto={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onFullscreen={(url) => { setFullscreenPhoto(url); setSelectedPhoto(null); }}
        showAlbumSelector={showAlbumSelector}
        setShowAlbumSelector={setShowAlbumSelector}
        albums={albums}
        userId={userId}
      />

      {/* Album Selector Modal */}
      <Modal
        visible={showAlbumSelector && !!selectedPhoto}
        transparent
        animationType={isDesktop ? "fade" : "slide"}
        onRequestClose={() => setShowAlbumSelector(false)}
      >
        <TouchableOpacity
          style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, isDesktop ? { justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'flex-end' }]}
          activeOpacity={1}
          onPress={() => setShowAlbumSelector(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              { backgroundColor: tc.bgCard },
              isDesktop
                ? { borderRadius: 20, width: 380, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
                : { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: insets.bottom + 16 }
            ]}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text, marginBottom: 16 }}>Agregar a álbum</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {albums.map(album => (
                <TouchableOpacity
                  key={album.id}
                  style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: tc.borderLight }}
                  onPress={async () => {
                    if (!selectedPhoto) return;
                    const { error } = await supabase.from('user_photos').update({ album_id: album.id }).eq('id', selectedPhoto.id);
                    if (!error) {
                      showToast.success(`Agregada a "${album.name}"`);
                      fetchUserPhotos(userId);
                    }
                    setShowAlbumSelector(false);
                    setSelectedPhoto(null);
                  }}
                >
                  {album.cover_photo_url ? (
                    <Image source={{ uri: album.cover_photo_url }} style={{ width: 36, height: 36, borderRadius: 6 }} />
                  ) : (
                    <FolderOpen size={20} color={tc.textSecondary} />
                  )}
                  <Text style={{ fontSize: 14, color: tc.text, flex: 1 }}>{album.name}</Text>
                  <ChevronRight size={16} color={tc.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }} onPress={() => { setShowAlbumSelector(false); setSelectedPhoto(null); }}>
              <Text style={{ fontSize: 15, color: tc.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Album Menu Modal */}
      <Modal
        visible={showAlbumModal && !!selectedAlbum}
        transparent
        animationType={isDesktop ? "fade" : "slide"}
        onRequestClose={() => setShowAlbumModal(false)}
      >
        <TouchableOpacity
          style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, isDesktop ? { justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'flex-end' }]}
          activeOpacity={1}
          onPress={() => setShowAlbumModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              { backgroundColor: tc.bgCard },
              isDesktop
                ? { borderRadius: 20, width: 380, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
                : { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: insets.bottom + 16 }
            ]}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: tc.text, marginBottom: 16 }}>{selectedAlbum?.name}</Text>

            <TouchableOpacity
              style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
              onPress={() => {
                if (!selectedAlbum) return;
                if (Platform.OS === 'ios') {
                  Alert.prompt('Renombrar álbum', 'Nuevo nombre:', async (text) => {
                    if (text?.trim()) await renameAlbum(selectedAlbum.id, text.trim());
                  }, 'plain-text', selectedAlbum.name);
                } else if (Platform.OS === 'web') {
                  const newName = window.prompt('Renombrar álbum', selectedAlbum.name);
                  if (newName?.trim()) renameAlbum(selectedAlbum.id, newName.trim());
                } else {
                  Alert.alert('Aviso', 'Renombrar en Android requiere un modal adicional. Próximamente.');
                }
                setShowAlbumModal(false);
              }}
            >
              <Text style={{ fontSize: 18 }}>✏️</Text>
              <Text style={{ fontSize: 15, color: tc.text }}>Renombrar álbum</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14 }}
              onPress={() => {
                if (!selectedAlbum) return;
                const msg = `¿Eliminar "${selectedAlbum.name}"? Las fotos no se borrarán.`;
                if (Platform.OS === 'web') {
                  if (window.confirm(msg)) {
                    deleteAlbum(selectedAlbum.id);
                    showToast.success('Álbum eliminado');
                    setShowAlbumModal(false);
                  }
                } else {
                  Alert.alert('Eliminar álbum', msg, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: async () => {
                        await deleteAlbum(selectedAlbum.id);
                        showToast.success('Álbum eliminado');
                        setShowAlbumModal(false);
                    }}
                  ]);
                }
              }}
            >
              <Text style={{ fontSize: 18 }}>🗑️</Text>
              <Text style={{ fontSize: 15, color: '#ef4444' }}>Eliminar álbum</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: tc.borderLight, marginTop: 8 }} />
            <TouchableOpacity style={{ height: 48, alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowAlbumModal(false)}>
              <Text style={{ fontSize: 15, color: tc.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Lightbox Fullscreen */}
      <LightboxModal
        fullscreenPhoto={fullscreenPhoto}
        onClose={() => setFullscreenPhoto(null)}
      />

    </ScrollView>
  );
}

export function PhotoMenuModal({
  visible, selectedPhoto, onClose, onFullscreen, showAlbumSelector, setShowAlbumSelector, albums, userId
}: {
  visible: boolean; selectedPhoto: UserPhoto | null; onClose: () => void; onFullscreen: (url: string) => void;
  showAlbumSelector: boolean; setShowAlbumSelector: (val: boolean) => void; albums: PhotoAlbum[]; userId: string;
}) {
  const tc = useThemeColors();
  const { user, fetchProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const { setAsAvatar, setAsBanner, deletePhoto } = usePhotosStore();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isDesktop ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, isDesktop ? { justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'flex-end' }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            { backgroundColor: tc.bgCard },
            isDesktop
              ? { borderRadius: 20, width: 380, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
              : { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: insets.bottom + 16 }
          ]}
        >
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Image source={{ uri: selectedPhoto?.url }} style={{ width: 56, height: 56, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: tc.textSecondary }}>
                {selectedPhoto?.source === 'avatar' ? 'Foto de perfil actual' :
                 selectedPhoto?.source === 'cover' ? 'Banner actual' :
                 selectedPhoto?.source === 'post' ? 'Foto de publicación' : 'Foto subida'}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: tc.text, marginTop: 2 }}>Opciones</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: tc.borderLight, marginBottom: 8 }} />

          <TouchableOpacity
            style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
            onPress={() => selectedPhoto?.url && onFullscreen(selectedPhoto.url)}
          >
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <Text style={{ fontSize: 15, color: tc.text }}>Ver a pantalla completa</Text>
          </TouchableOpacity>

          {selectedPhoto?.source !== 'avatar' && (
            <TouchableOpacity
              style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
              onPress={async () => {
                if (!user || !selectedPhoto) return;
                const ok = await setAsAvatar(selectedPhoto.url, user.id);
                if (ok) { await fetchProfile(); showToast.success('Foto de perfil actualizada'); }
                else { showToast.error('Error al actualizar'); }
                onClose();
              }}
            >
              <Text style={{ fontSize: 18 }}>👤</Text>
              <Text style={{ fontSize: 15, color: tc.text }}>Usar como foto de perfil</Text>
            </TouchableOpacity>
          )}

          {selectedPhoto?.source !== 'cover' && (
            <TouchableOpacity
              style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
              onPress={async () => {
                if (!user || !selectedPhoto) return;
                const ok = await setAsBanner(selectedPhoto.url, user.id);
                if (ok) { await fetchProfile(); showToast.success('Banner actualizado'); }
                else { showToast.error('Error al actualizar'); }
                onClose();
              }}
            >
              <Text style={{ fontSize: 18 }}>🌄</Text>
              <Text style={{ fontSize: 15, color: tc.text }}>Usar como banner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
            onPress={async () => {
              if (!selectedPhoto) return;
              const { error } = await supabase.from('posts').insert({
                content: '',
                media_urls: [selectedPhoto.url],
                author_id: user?.id,
                locality_id: null
              });
              if (!error) showToast.success('Compartida en tu muro');
              else showToast.error('Error al compartir');
              onClose();
            }}
          >
            <Text style={{ fontSize: 18 }}>📤</Text>
            <Text style={{ fontSize: 15, color: tc.text }}>Compartir en mi muro</Text>
          </TouchableOpacity>

          {selectedPhoto?.source === 'standalone' && albums.length > 0 && (
            <TouchableOpacity
              style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderColor: tc.borderLight }}
              onPress={() => setShowAlbumSelector(true)}
            >
              <Text style={{ fontSize: 18 }}>📁</Text>
              <Text style={{ fontSize: 15, color: tc.text }}>Agregar a álbum</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            onPress={() => {
              if (!selectedPhoto) return;
              const msg = selectedPhoto.source === 'avatar' ? 'La foto se eliminará del álbum, pero seguirá siendo tu foto de perfil.' :
                          selectedPhoto.source === 'cover' ? 'La foto se eliminará del álbum, pero seguirá siendo tu banner.' :
                          selectedPhoto.source === 'post' ? 'Se eliminará de tus fotos, pero no de la publicación original.' :
                          '¿Eliminar esta foto?';
              if (Platform.OS === 'web') {
                if (window.confirm(msg)) {
                  deletePhoto(selectedPhoto.id).then(onClose);
                }
              } else {
                Alert.alert('Eliminar foto', msg, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: async () => {
                      await deletePhoto(selectedPhoto.id);
                      onClose();
                  }}
                ]);
              }
            }}
          >
            <Text style={{ fontSize: 18 }}>🗑️</Text>
            <Text style={{ fontSize: 15, color: '#ef4444' }}>Eliminar</Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: tc.borderLight, marginTop: 8 }} />
          <TouchableOpacity style={{ height: 48, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
            <Text style={{ fontSize: 15, color: tc.textSecondary }}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function LightboxModal({
  fullscreenPhoto, onClose
}: {
  fullscreenPhoto: string | null; onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;

  return (
    <Modal
      visible={!!fullscreenPhoto}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            position: 'absolute', top: insets.top + 12, right: 20, zIndex: 10,
            width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center', alignItems: 'center'
          }}
          onPress={onClose}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
        {fullscreenPhoto && (
          <Image
            source={{ uri: fullscreenPhoto }}
            style={{ width: '100%', height: isDesktop ? '85%' : '80%' }}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
}
