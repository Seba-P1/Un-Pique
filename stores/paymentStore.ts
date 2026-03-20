import { create } from 'zustand';

export interface PaymentMethod {
    id: string;
    type: 'credit_card' | 'debit_card' | 'cash' | 'mercadopago';
    name: string;
    icon: string;
}

export interface PaymentState {
    selectedMethod: PaymentMethod | null;
    processing: boolean;
    error: string | null;

    // Actions
    setPaymentMethod: (method: PaymentMethod) => void;
    processPayment: (amount: number, orderId: string) => Promise<boolean>;
    clearError: () => void;
}

// Mock payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'mercadopago',
        type: 'mercadopago',
        name: 'MercadoPago',
        icon: '💳'
    },
    {
        id: 'cash',
        type: 'cash',
        name: 'Efectivo',
        icon: '💵'
    },
];

export const usePaymentStore = create<PaymentState>((set, get) => ({
    selectedMethod: null,
    processing: false,
    error: null,

    setPaymentMethod: (method) => {
        set({ selectedMethod: method, error: null });
    },

    processPayment: async (amount: number, orderId: string) => {
        set({ processing: true, error: null });

        try {
            const { selectedMethod } = get();

            if (!selectedMethod) {
                throw new Error('No se seleccionó método de pago');
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (selectedMethod.type === 'mercadopago') {
                // TODO: Integrate real MercadoPago SDK
                // const preference = await createPreference(amount, orderId);
                // const paymentResult = await openMercadoPago(preference.id);
                // return paymentResult.status === 'approved';

                // Mock success for now
                console.log('Processing MercadoPago payment:', { amount, orderId });
            } else if (selectedMethod.type === 'cash') {
                // Cash payment - always succeeds
                console.log('Cash payment selected:', { amount, orderId });
            }

            set({ processing: false });
            return true;

        } catch (error: any) {
            set({
                processing: false,
                error: error.message || 'Error al procesar el pago'
            });
            return false;
        }
    },

    clearError: () => {
        set({ error: null });
    },
}));
