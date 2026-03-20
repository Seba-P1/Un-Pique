import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import colors from '../../constants/colors';
import { Button } from '../../components/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function OrderSuccessScreen() {
    const router = useRouter();
    const tc = useThemeColors();

    const handleContinue = () => {
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Check size={48} color={colors.white} strokeWidth={3} />
                </View>

                <Text style={[styles.title, { color: tc.text }]}>¡Pedido Realizado!</Text>
                <Text style={[styles.description, { color: tc.textSecondary }]}>
                    Tu pedido ha sido enviado al comercio. Te avisaremos cuando esté en camino.
                </Text>

                <View style={[styles.orderInfo, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.infoLabel, { color: tc.textMuted }]}>Tiempo estimado</Text>
                    <Text style={[styles.infoValue, { color: tc.text }]}>30-45 min</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Button title="Volver al Inicio" onPress={handleContinue} />
                <Button
                    title="Ver Estado"
                    variant="outline"
                    onPress={handleContinue}
                    style={{ marginTop: 12 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
        
    },
    title: {
        fontFamily: 'Nunito Sans',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    orderInfo: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        width: '100%',
    },
    infoLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        marginBottom: 4,
    },
    infoValue: {
        fontFamily: 'Nunito Sans',
        fontSize: 20,
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
});
