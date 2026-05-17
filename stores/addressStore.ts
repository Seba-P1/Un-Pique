import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Address {
  id: string;
  label: string;
  street: string;
  details?: string;
  city?: string;
  is_default: boolean;
}

interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
  loading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (data: Omit<Address, 'id' | 'is_default'>) => Promise<Address | null>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  selectAddress: (address: Address) => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  selectedAddress: null,
  loading: false,

  fetchAddresses: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    set({ 
      addresses: data || [],
      selectedAddress: data?.find(a => a.is_default) || data?.[0] || null,
      loading: false
    });
  },

  addAddress: async (addressData) => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return null;
    }

    const { addresses } = get();
    
    const { data } = await supabase
      .from('user_addresses')
      .insert({ user_id: user.id, ...addressData, is_default: addresses.length === 0 })
      .select()
      .single();

    if (data) {
      set(state => ({ 
        addresses: [data, ...state.addresses],
        selectedAddress: state.selectedAddress || data
      }));
    }
    
    set({ loading: false });
    return data;
  },

  updateAddress: async (id, data) => {
    set({ loading: true });
    const { error } = await supabase
      .from('user_addresses')
      .update(data)
      .eq('id', id);

    if (!error) {
      await get().fetchAddresses();
    }
    
    set({ loading: false });
    return !error;
  },

  deleteAddress: async (id) => {
    set({ loading: true });
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      await get().fetchAddresses();
    }
    
    set({ loading: false });
    return !error;
  },

  setDefaultAddress: async (id) => {
    set({ loading: true });
    await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id);
      
    // The Supabase trigger automatically unsets other default addresses
    await get().fetchAddresses(); // Refetch to sync
    
    set({ loading: false });
    return true;
  },

  selectAddress: (address) => {
    set({ selectedAddress: address });
  }
}));
