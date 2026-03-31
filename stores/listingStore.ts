// Listing Store — Zustand state management for services & accommodations
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type ListingType = 'service' | 'accommodation';

export interface Listing {
  id: string;
  user_id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  // Campos de servicio
  specialty?: string;
  hourly_rate?: number;
  // Campos de alojamiento
  amenities: string[];
  check_in?: string;
  check_out?: string;
  max_guests?: number;
  accommodation_type?: string;
  // Meta
  rating: number;
  reviews_count: number;
  is_active: boolean;
  is_verified: boolean;
  locality_id?: string;
  created_at: string;
  updated_at: string;
  // Relación (join con profiles)
  owner_name?: string;
  owner_avatar?: string;
}

export type CreateListingInput = Omit<Listing, 'id' | 'rating' | 'reviews_count' | 'is_active' | 'is_verified' | 'created_at' | 'updated_at' | 'owner_name' | 'owner_avatar'>;

interface ListingState {
  // Listados públicos
  services: Listing[];
  accommodations: Listing[];
  // Listados del usuario
  userListings: Listing[];
  // UI
  loading: boolean;
  saving: boolean;
  selectedListing: Listing | null;

  // Acciones públicas
  fetchServices: (category?: string) => Promise<void>;
  fetchAccommodations: () => Promise<void>;
  // Acciones del usuario
  fetchUserListings: () => Promise<void>;
  createListing: (input: Partial<CreateListingInput>) => Promise<{ data: Listing | null; error: string | null }>;
  updateListing: (id: string, data: Partial<Listing>) => Promise<boolean>;
  deleteListing: (id: string) => Promise<boolean>;
  toggleListingActive: (id: string, isActive: boolean) => Promise<boolean>;
  // Selección
  setSelectedListing: (listing: Listing | null) => void;
}

const formatListing = (row: Record<string, unknown>): Listing => ({
  id: row.id as string,
  user_id: row.user_id as string,
  type: row.type as ListingType,
  title: row.title as string,
  description: (row.description as string) || '',
  category: (row.category as string) || '',
  phone: (row.phone as string) || '',
  email: row.email as string | undefined,
  address: row.address as string | undefined,
  latitude: row.latitude as number | undefined,
  longitude: row.longitude as number | undefined,
  images: (row.images as string[]) || [],
  specialty: row.specialty as string | undefined,
  hourly_rate: row.hourly_rate as number | undefined,
  amenities: (row.amenities as string[]) || [],
  check_in: row.check_in as string | undefined,
  check_out: row.check_out as string | undefined,
  max_guests: row.max_guests as number | undefined,
  accommodation_type: row.accommodation_type as string | undefined,
  rating: (row.rating as number) || 0,
  reviews_count: (row.reviews_count as number) || 0,
  is_active: row.is_active as boolean,
  is_verified: (row.is_verified as boolean) || false,
  locality_id: row.locality_id as string | undefined,
  created_at: row.created_at as string,
  updated_at: row.updated_at as string,
});

export const useListingStore = create<ListingState>((set, get) => ({
  services: [],
  accommodations: [],
  userListings: [],
  loading: false,
  saving: false,
  selectedListing: null,

  setSelectedListing: (listing) => set({ selectedListing: listing }),

  fetchServices: async (category) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('type', 'service')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      set({ services: (data || []).map(formatListing) });
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchAccommodations: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'accommodation')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ accommodations: (data || []).map(formatListing) });
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchUserListings: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ userListings: (data || []).map(formatListing) });
    } catch (error) {
      console.error('Error fetching user listings:', error);
    } finally {
      set({ loading: false });
    }
  },

  createListing: async (input) => {
    set({ saving: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'No estás logueado' };

      const { data, error } = await supabase
        .from('listings')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      const listing = formatListing(data);

      // Actualizar lista local según tipo
      if (listing.type === 'service') {
        set((state) => ({ services: [listing, ...state.services] }));
      } else {
        set((state) => ({ accommodations: [listing, ...state.accommodations] }));
      }
      // Actualizar lista del usuario
      set((state) => ({ userListings: [listing, ...state.userListings] }));

      return { data: listing, error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error creating listing:', message);
      return { data: null, error: message };
    } finally {
      set({ saving: false });
    }
  },

  updateListing: async (id, data) => {
    set({ saving: true });
    try {
      const { error } = await supabase
        .from('listings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Refrescar listas
      await get().fetchUserListings();
      return true;
    } catch (error) {
      console.error('Error updating listing:', error);
      return false;
    } finally {
      set({ saving: false });
    }
  },

  deleteListing: async (id) => {
    set({ saving: true });
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remover de las listas locales
      set((state) => ({
        services: state.services.filter((l) => l.id !== id),
        accommodations: state.accommodations.filter((l) => l.id !== id),
        userListings: state.userListings.filter((l) => l.id !== id),
      }));
      return true;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    } finally {
      set({ saving: false });
    }
  },

  toggleListingActive: async (id, isActive) => {
    return get().updateListing(id, { is_active: isActive });
  },
}));
