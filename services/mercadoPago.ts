import { Alert } from 'react-native';

// Mercado Pago Integration Service (Simulated/Real Hybrid Structure)

interface PaymentPreference {
    items: {
        title: string;
        quantity: number;
        currency_id: 'ARS';
        unit_price: number;
    }[];
    payer: {
        email: string;
    };
    external_reference: string;
}

export const createPaymentPreference = async (preference: PaymentPreference) => {
    // In a real app, this would call your backend (Supabase Edge Function or custom server)
    // which in turn calls Mercado Pago API to create a preference.
    // For now, we simulate the network request.

    console.log('Creating preference for:', preference);

    return new Promise<{ init_point: string; sandbox_init_point: string }>((resolve, reject) => {
        setTimeout(() => {
            // Simulate success
            resolve({
                init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=simulated',
                sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=simulated'
            });
        }, 1500);
    });
};

export const handlePaymentResult = (result: string) => {
    // Handle deep link return
    // e.g. unpique://checkout/success, unpique://checkout/failure
    console.log('Payment result:', result);
};

// Simulation Helper
export const simulatePaymentFlow = () => {
    return new Promise<'approved' | 'rejected'>((resolve) => {
        Alert.alert(
            "Simulación de Mercado Pago",
            "Elige el resultado del pago",
            [
                { text: "Rechazar", onPress: () => resolve('rejected'), style: 'destructive' },
                { text: "Aprobar", onPress: () => resolve('approved') }
            ]
        );
    });
};
