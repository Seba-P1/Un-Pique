import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Business } from '../stores/businessStore';

export const useBusinesses = (localityId?: string) => {
    return useQuery({
        queryKey: ['businesses', localityId],
        queryFn: async (): Promise<Business[]> => {
            if (!localityId) return [];

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('locality_id', localityId)
                .order('is_open', { ascending: false }); // Open first

            if (error) throw error;
            return data as Business[];
        },
        enabled: !!localityId,
    });
};

export const useBusinessDetail = (slugOrId: string) => {
    return useQuery({
        queryKey: ['business', slugOrId],
        queryFn: async (): Promise<Business> => {
            // Try fetch by slug first (assuming we might change routing later, but for now ID is primary ID but slug is passed)
            // Or if slugOrId looks like UUID
            let query = supabase.from('businesses').select('*').single();

            // For now simple check, assuming we use ID mainly or slug
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .or(`id.eq.${slugOrId},slug.eq.${slugOrId}`)
                .single();

            if (error) throw error;
            return data as Business;
        },
        enabled: !!slugOrId,
    });
};
