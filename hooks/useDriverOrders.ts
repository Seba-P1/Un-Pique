import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';
    total_amount: number;
    delivery_fee: number;
    business_id: string;
    user_id: string;
    driver_id?: string;
    address: string;
    business?: {
        name: string;
        address: string;
        logo_url: string;
        cover_url?: string; // Optional
    };
    items?: any[]; // Loaded separately usually
}

export const useDriverOrders = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch orders assigned to current driver OR available orders in current locality
    // For simplicity, we'll just fetch orders assigned to driver AND ready_for_pickup orders in general
    // In a real app, you filter by locality/radius

    return useQuery({
        queryKey: ['driver_orders', user?.id],
        queryFn: async (): Promise<Order[]> => {
            if (!user) return [];

            // Fetch assigned orders (active)
            const { data: assignedData, error: assignedError } = await supabase
                .from('orders')
                .select('*, business:businesses(name, address, logo_url)')
                .eq('driver_id', user.id)
                .in('status', ['picked_up', 'delivering'])
                .order('created_at', { ascending: false });

            if (assignedError) throw assignedError;

            // Fetch available orders (ready for pickup)
            const { data: availableData, error: availableError } = await supabase
                .from('orders')
                .select('*, business:businesses(name, address, logo_url)')
                .is('driver_id', null)
                .eq('status', 'ready_for_pickup')
                .order('created_at', { ascending: false });

            if (availableError) throw availableError;

            // Combine and tag them
            const combined = [
                ...(assignedData || []),
                ...(availableData || [])
            ];

            return combined as Order[];
        },
        enabled: !!user,
        refetchInterval: 10000, // Poll every 10s for new orders
    });
};

export const useOrderDetail = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: async (): Promise<Order> => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    business:businesses(*),
                    items:order_items(
                        *,
                        product:products(*)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            // Map simple customer data for now (assuming users table or just stored in address/profile)
            // Ideally we join with profiles table if it exists
            return {
                ...data,
                customer: {
                    name: 'Cliente', // Placeholder if no profile join
                    phone: '',
                    ...data.address // If address is JSON, or just use address string
                }
            } as any;
        },
        enabled: !!orderId,
    });
};

export const useOrderMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const acceptOrder = useMutation({
        mutationFn: async (orderId: string) => {
            if (!user) throw new Error("No authenticated user");

            const { error } = await supabase
                .from('orders')
                .update({
                    driver_id: user.id,
                    status: 'delivering' // Or 'picked_up' if they are at the store. Let's say accepting means "I'm taking it"
                })
                .eq('id', orderId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver_orders'] });
        }
    });

    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver_orders'] });
        }
    });

    return { acceptOrder, updateOrderStatus };
};
