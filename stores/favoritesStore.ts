import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Favorite {
    id: string;
    user_id: string;
    business_id: string;
    created_at: string;
}

interface FavoritesState {
    favorites: Favorite[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchFavorites: (userId: string) => Promise<void>;
    addFavorite: (businessId: string) => Promise<void>;
    removeFavorite: (businessId: string) => Promise<void>;
    isFavorite: (businessId: string) => boolean;
    toggleFavorite: (businessId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    favorites: [],
    loading: false,
    error: null,

    fetchFavorites: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ favorites: data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error('Error fetching favorites:', error);
        }
    },

    addFavorite: async (businessId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('user_favorites')
                .insert({ user_id: user.id, business_id: businessId });

            if (error) throw error;

            // Optimistically update local state
            set((state) => ({
                favorites: [
                    ...state.favorites,
                    {
                        id: crypto.randomUUID(),
                        user_id: user.id,
                        business_id: businessId,
                        created_at: new Date().toISOString(),
                    },
                ],
            }));
        } catch (error: any) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    },

    removeFavorite: async (businessId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('business_id', businessId);

            if (error) throw error;

            // Optimistically update local state
            set((state) => ({
                favorites: state.favorites.filter((fav) => fav.business_id !== businessId),
            }));
        } catch (error: any) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    },

    isFavorite: (businessId: string) => {
        return get().favorites.some((fav) => fav.business_id === businessId);
    },

    toggleFavorite: async (businessId: string) => {
        const { isFavorite, addFavorite, removeFavorite } = get();

        if (isFavorite(businessId)) {
            await removeFavorite(businessId);
        } else {
            await addFavorite(businessId);
        }
    },
}));
