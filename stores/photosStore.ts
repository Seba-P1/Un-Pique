import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../services/imageUpload';

export interface UserPhoto {
  id: string;
  url: string;
  source: 'avatar' | 'cover' | 'post' | 'standalone';
  album_id?: string | null;
  post_id?: string | null;
  created_at: string;
  user_id?: string;
}

export interface PhotoAlbum {
  id: string;
  name: string;
  cover_photo_url?: string | null;
  photos_count: number;
  is_auto: boolean;
}

interface PhotosState {
  albums: PhotoAlbum[];
  allPhotos: UserPhoto[];
  loading: boolean;
  saving: boolean;

  fetchUserPhotos: (userId: string) => Promise<void>;
  fetchAlbumPhotos: (albumId: string) => Promise<UserPhoto[]>;
  createAlbum: (name: string) => Promise<PhotoAlbum | null>;
  renameAlbum: (albumId: string, name: string) => Promise<boolean>;
  deleteAlbum: (albumId: string) => Promise<boolean>;
  uploadStandalonePhoto: (uri: string, albumId?: string) => Promise<UserPhoto | null>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  setAsAvatar: (url: string, userId: string) => Promise<boolean>;
  setAsBanner: (url: string, userId: string) => Promise<boolean>;
}

export const usePhotosStore = create<PhotosState>((set, get) => ({
  albums: [],
  allPhotos: [],
  loading: false,
  saving: false,

  fetchUserPhotos: async (userId) => {
    set({ loading: true });
    try {
      const [photosRes, albumsRes, postsRes, profileRes] = await Promise.all([
        supabase.from('user_photos').select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('photo_albums').select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase.from('posts').select('id, media_urls, created_at')
          .eq('author_id', userId)
          .neq('media_urls', '{}')
          .order('created_at', { ascending: false }),
        supabase.from('users').select('avatar_url, cover_url')
          .eq('id', userId).single()
      ]);

      const standalonePhotos: UserPhoto[] = photosRes.data || [];

      // Fotos de posts — aplanar el array de media_urls
      const postPhotos: UserPhoto[] = [];
      (postsRes.data || []).forEach((post: any) => {
        (post.media_urls || []).forEach((url: string) => {
          postPhotos.push({
            id: `post_${post.id}_${url}`,
            url,
            source: 'post',
            post_id: post.id,
            album_id: null,
            created_at: post.created_at
          });
        });
      });

      // Avatar y banner — fotos virtuales (no en tabla)
      const autoPhotos: UserPhoto[] = [];
      if (profileRes.data?.avatar_url) {
        autoPhotos.push({
          id: 'virtual_avatar',
          url: profileRes.data.avatar_url,
          source: 'avatar',
          album_id: null,
          post_id: null,
          created_at: new Date(0).toISOString() // al final del sort
        });
      }
      if (profileRes.data?.cover_url) {
        autoPhotos.push({
          id: 'virtual_cover',
          url: profileRes.data.cover_url,
          source: 'cover',
          album_id: null,
          post_id: null,
          created_at: new Date(0).toISOString()
        });
      }

      const allPhotos = [...standalonePhotos, ...postPhotos, ...autoPhotos]
        .sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      set({ allPhotos, albums: albumsRes.data || [], loading: false });
    } catch (e) {
      console.error('[photosStore] fetchUserPhotos:', e);
      set({ loading: false });
    }
  },

  fetchAlbumPhotos: async (albumId) => {
    const { data } = await supabase.from('user_photos').select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  createAlbum: async (name) => {
    set({ saving: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ saving: false }); return null; }
    const { data, error } = await supabase.from('photo_albums')
      .insert({ user_id: user.id, name, is_auto: false })
      .select().single();
    set({ saving: false });
    if (error || !data) return null;
    set(state => ({ albums: [...state.albums, data] }));
    return data;
  },

  renameAlbum: async (albumId, name) => {
    const { error } = await supabase.from('photo_albums')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', albumId);
    if (!error) {
      set(state => ({
        albums: state.albums.map(a =>
          a.id === albumId ? { ...a, name } : a
        )
      }));
    }
    return !error;
  },

  deleteAlbum: async (albumId) => {
    const { error } = await supabase.from('photo_albums')
      .delete().eq('id', albumId);
    if (!error) {
      set(state => ({
        albums: state.albums.filter(a => a.id !== albumId)
      }));
    }
    return !error;
  },

  uploadStandalonePhoto: async (uri, albumId) => {
    set({ saving: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ saving: false }); return null; }
    try {
      // BUCKET: 'photos' — carpeta por userId
      const result = await uploadImage(uri, 'photos', user.id, {
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 0.8
      });
      const { data, error } = await supabase.from('user_photos')
        .insert({
          user_id: user.id,
          url: result.url,
          source: 'standalone',
          album_id: albumId || null
        })
        .select().single();
      if (error) throw error;
      
      // BUG 2 FIXED (upload): Incrementar el contador de fotos en el álbum
      if (albumId) {
        await supabase.rpc('increment_album_photo_count', { album_id: albumId });
      }

      set(state => ({
        allPhotos: [data as UserPhoto, ...state.allPhotos],
        saving: false
      }));
      return data as UserPhoto;
    } catch (e) {
      console.error('[photosStore] uploadStandalonePhoto:', e);
      set({ saving: false });
      return null;
    }
  },

  deletePhoto: async (photoId) => {
    // BUG 3 FIXED: Validation to prevent deleting photos that belong to someone else
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const photo = get().allPhotos.find(p => p.id === photoId);
    if (!photo) return false;

    // Solo borrar de DB si es standalone (las virtuales no están en la tabla)
    if (
      !photoId.startsWith('post_') &&
      photoId !== 'virtual_avatar' &&
      photoId !== 'virtual_cover'
    ) {
      if (photo.user_id !== user.id) {
        console.error('No tenés permiso para eliminar esta foto.');
        return false;
      }
      
      const { error } = await supabase.from('user_photos').delete().eq('id', photoId);
      if (error) return false;
      
      // BUG 2 FIXED (delete): Decrementar el contador de fotos en el álbum
      if (photo.album_id) {
        await supabase.rpc('decrement_album_photo_count', { album_id: photo.album_id });
      }
    }
    set(state => ({
      allPhotos: state.allPhotos.filter(p => p.id !== photoId)
    }));
    return true;
  },

  setAsAvatar: async (url, userId) => {
    const { error } = await supabase.from('users')
      .update({ avatar_url: url }).eq('id', userId);
    return !error;
  },

  setAsBanner: async (url, userId) => {
    const { error } = await supabase.from('users')
      .update({ cover_url: url }).eq('id', userId);
    return !error;
  },
}));
