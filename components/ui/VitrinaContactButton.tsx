import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface VitrinaContactButtonProps {
    whatsapp: string;
    productName: string;
    productPrice: number;
    businessName: string;
}

export const VitrinaContactButton: React.FC<VitrinaContactButtonProps> = ({
    whatsapp,
    productName,
    productPrice,
    businessName
}) => {
    const tc = useThemeColors();

    const handlePress = async () => {
        const message = `Hola! Vi *${productName}* ($${Math.round(productPrice).toLocaleString('es-AR')}) en *Un Pique*. ¿Está disponible?`;
        
        // Ensure whatsapp string only contains numbers
        const cleanNumber = whatsapp.replace(/\D/g, '');
        // Prefix with 549 if it doesn't have country code (assuming Argentina as per instructions)
        const finalNumber = cleanNumber.startsWith('54') ? cleanNumber : `549${cleanNumber}`;
        
        const waUrl = `whatsapp://send?phone=${finalNumber}&text=${encodeURIComponent(message)}`;
        const waWebUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
        
        try {
            if (Platform.OS === 'web') {
                window.open(waWebUrl, '_blank');
            } else {
                const canOpen = await Linking.canOpenURL(waUrl);
                if (canOpen) {
                    await Linking.openURL(waUrl);
                } else {
                    // Fallback if whatsapp is not installed on mobile
                    await Linking.openURL(`tel:${finalNumber}`);
                }
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            // Absolute fallback
            Linking.openURL(`tel:${finalNumber}`).catch(() => {});
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.button}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <MessageCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Consultar por WhatsApp</Text>
            </TouchableOpacity>
            
            <Text style={[styles.subText, { color: tc.textMuted }]}>
                El pago se acuerda directamente con el vendedor
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#22C55E',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subText: {
        marginTop: 12,
        fontSize: 12,
        textAlign: 'center',
    }
});
