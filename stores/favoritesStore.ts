// Favorites Store — Zustand state management for user favorites
// Supports both businesses and products. Graceful fallback if table doesn't exist.
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface FavoritesState {
    businessIds: string[];
    productIds: string[];
    listingIds: string[];
    newFavoritesCount: number;
    loading: boolean;
    tableExists: boolean | null; // null = unknown, true/false = checked

    fetchFavorites: () => Promise<void>;
    toggleFavorite: (type: 'business' | 'product' | 'listing', id: string) => Promise<void>;
    clearNewFavoritesCount: () => void;
    isFavorite: (type: 'business' | 'product' | 'listing', id: string) => boolean;
    totalCount: () => number;
    reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    businessIds: [],
    productIds: [],
    listingIds: [],
    newFavoritesCount: 0,
    loading: false,
    tableExists: null,

    fetchFavorites: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            set({ loading: true });

            const { data, error } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                // Table might not exist — check error code
                if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    console.warn('[Favorites] Table user_favorites does not exist yet. Running in local-only mode.');
                    set({ tableExists: false, loading: false });
                    return;
                }
                throw error;
            }

            set({
                tableExists: true,
                businessIds: (data || []).filter((f: any) => f.business_id).map((f: any) => f.business_id),
                productIds: (data || []).filter((f: any) => f.product_id).map((f: any) => f.product_id),
                listingIds: (data || []).filter((f: any) => f.listing_id).map((f: any) => f.listing_id),
                loading: false,
            });
        } catch (err: any) {
            console.error('[Favorites] Error fetching:', err);
            set({ loading: false });
        }
    },

    toggleFavorite: async (type: 'business' | 'product' | 'listing', id: string) => {
        const state = get();
        const list = type === 'business' ? state.businessIds : type === 'product' ? state.productIds : state.listingIds;
        const isCurrentlyFavorite = list.includes(id);

        // Optimistic update
        if (isCurrentlyFavorite) {
            if (type === 'business') {
                set({ businessIds: state.businessIds.filter((x) => x !== id) });
            } else if (type === 'product') {
                set({ productIds: state.productIds.filter((x) => x !== id) });
            } else {
                set({ listingIds: state.listingIds.filter((x) => x !== id) });
            }
        } else {
            set({ newFavoritesCount: state.newFavoritesCount + 1 });
            if (type === 'business') {
                set({ businessIds: [...state.businessIds, id] });
            } else if (type === 'product') {
                set({ productIds: [...state.productIds, id] });
            } else {
                set({ listingIds: [...state.listingIds, id] });
            }
        }

        // If table doesn't exist, keep local-only
        if (state.tableExists === false) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const column = type === 'business' ? 'business_id' : type === 'product' ? 'product_id' : 'listing_id';

            if (isCurrentlyFavorite) {
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq(column, id);

                if (error) throw error;
            } else {
                const insertPayload: any = { user_id: user.id };
                insertPayload[column] = id;

                const { error } = await supabase
                    .from('user_favorites')
                    .insert(insertPayload);

                if (error) throw error;
            }
        } catch (err: any) {
            console.error('[Favorites] Error toggling:', err);
            // Revert optimistic update
            if (isCurrentlyFavorite) {
                if (type === 'business') {
                    set({ businessIds: [...get().businessIds, id] });
                } else if (type === 'product') {
                    set({ productIds: [...get().productIds, id] });
                } else {
                    set({ listingIds: [...get().listingIds, id] });
                }
            } else {
                if (type === 'business') {
                    set({ businessIds: get().businessIds.filter((x) => x !== id) });
                } else if (type === 'product') {
                    set({ productIds: get().productIds.filter((x) => x !== id) });
                } else {
                    set({ listingIds: get().listingIds.filter((x) => x !== id) });
                }
            }
        }
    },

    isFavorite: (type: 'business' | 'product' | 'listing', id: string) => {
        if (type === 'listing') return get().listingIds.includes(id);
        return type === 'business'
            ? get().businessIds.includes(id)
            : get().productIds.includes(id);
    },

    clearNewFavoritesCount: () => set({ newFavoritesCount: 0 }),

    totalCount: () => {
        const s = get();
        return s.businessIds.length + s.productIds.length + s.listingIds.length;
    },

    reset: () => {
        set({ businessIds: [], productIds: [], listingIds: [], newFavoritesCount: 0, loading: false, tableExists: null });
    },
}));
