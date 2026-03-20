import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useCartStore } from './cartStore';
import { useLocationStore } from './locationStore';
import { Alert } from 'react-native';

interface OrderState {
    loading: boolean;
    createOrder: (
        userId: string,
        cartItems: any[],
        businessId: string,
        totalAmount: number,
        deliveryFee: number,
        address: string
    ) => Promise<string | null>; // Return orderId or null
}

export const useOrderStore = create<OrderState>((set) => ({
    loading: false,
    createOrder: async (userId, cartItems, businessId, totalAmount, deliveryFee, address) => {
        set({ loading: true });
        try {
            const { currentLocality } = useLocationStore.getState();
            if (!currentLocality) throw new Error("No locality selected");

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: userId,
                        business_id: businessId,
                        locality_id: currentLocality.id,
                        total_amount: totalAmount,
                        delivery_fee: deliveryFee,
                        status: 'pending',
                        address: address,
                        payment_method: 'pending', // Will be updated after payment
                    }
                ])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItemsData = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.unitPrice * item.quantity,
                options: item.options || {}
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            return order.id; // Return the order ID

        } catch (error: any) {
            console.error('Error creating order:', error);
            Alert.alert('Error', 'No se pudo crear el pedido: ' + error.message);
            return null;
        } finally {
            set({ loading: false });
        }
    },
}));
