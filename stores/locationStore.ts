// Location Store - Zustand state management for locality
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Locality interface
export interface Locality {
    id: string;
    name: string;
    slug: string;
    province: string;
    country: string;
    is_active: boolean;
    is_live: boolean;
}

// Location state interface
interface LocationState {
    currentLocality: Locality | null;
    availableLocalities: Locality[];
    isLoading: boolean;

    // Actions
    setCurrentLocality: (locality: Locality) => void;
    fetchLocalities: () => Promise<void>;
    selectLocalityBySlug: (slug: string) => Promise<boolean>;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
            currentLocality: null,
            availableLocalities: [],
            isLoading: false,

            setCurrentLocality: (locality) => set({ currentLocality: locality }),

            fetchLocalities: async () => {
                set({ isLoading: true });

                const { data, error } = await supabase
                    .from('localities')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                if (!error && data) {
                    set({ availableLocalities: data as Locality[] });

                    // Auto-select first locality if none selected
                    const current = get().currentLocality;
                    if (!current && data.length > 0) {
                        // Prefer live localities, then first available
                        const liveLocality = data.find((l) => l.is_live);
                        set({ currentLocality: (liveLocality || data[0]) as Locality });
                    }
                }

                set({ isLoading: false });
            },

            selectLocalityBySlug: async (slug) => {
                const localities = get().availableLocalities;
                let locality = localities.find((l) => l.slug === slug);

                if (!locality) {
                    // Fetch from database
                    const { data, error } = await supabase
                        .from('localities')
                        .select('*')
                        .eq('slug', slug)
                        .eq('is_active', true)
                        .single();

                    if (error || !data) return false;
                    locality = data as Locality;
                }

                set({ currentLocality: locality });
                return true;
            },
        }),
        {
            name: 'location-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentLocality: state.currentLocality,
            }),
        }
    )
);
