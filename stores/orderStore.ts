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
        subtotalAmount: number,
        deliveryFee: number,
        address: string
    ) => Promise<string | null>; // Return orderId or null
}

export const useOrderStore = create<OrderState>((set) => ({
    loading: false,
    createOrder: async (userId, cartItems, businessId, totalAmount, subtotalAmount, deliveryFee, address) => {
        set({ loading: true });
        try {
            const { currentLocality } = useLocationStore.getState();
            if (!currentLocality) throw new Error("No locality selected");

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                        customer_id: userId,
                        business_id: businessId,
                        locality_id: currentLocality.id,
                        subtotal: subtotalAmount,
                        total: totalAmount,
                        delivery_fee: deliveryFee,
                        delivery_address: address,
                        status: 'pending',
                        payment_method: 'mercadopago',
                        payment_status: 'pending',
                        order_type: 'delivery',
                    }
                ])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItemsData = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.productId,
                product_name: item.productName,
                product_image_url: item.productImage || null,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                options: item.options || {}
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) throw itemsError;

            return order.id; // Return the order ID

        } catch (error: any) {
            console.error('Error creating order:', error);
            return null;
        } finally {
            set({ loading: false });
        }
    },
}));
