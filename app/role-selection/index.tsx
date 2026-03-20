// Role Selection - Dark Mode Premium
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Store, Bike, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const tc = useThemeColors();

    const handleSelection = (role: 'client' | 'business' | 'driver') => {
        router.push({ pathname: '/(auth)/login', params: { initialRole: role } });
    };

    const roles = [
        { key: 'client' as const, icon: User, color: colors.primary.DEFAULT, bgColor: colors.primary.light + '20', title: 'Soy Cliente', desc: 'Quiero pedir comida, buscar servicios o ver novedades.' },
        { key: 'business' as const, icon: Store, color: colors.secondary.DEFAULT, bgColor: colors.secondary.light + '20', title: 'Soy Negocio', desc: 'Quiero vender mis productos y llegar a más clientes.' },
        { key: 'driver' as const, icon: Bike, color: colors.success, bgColor: colors.success + '20', title: 'Soy Repartidor', desc: 'Quiero hacer entregas y generar ingresos extra.' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={styles.header}>
                <Text style={styles.emoji}>👋</Text>
                <Text style={[styles.title, { color: tc.text }]}>¿Cómo querés usar{"\n"}la app hoy?</Text>
                <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Elegí tu perfil para comenzar</Text>
            </View>

            <ScrollView contentContainerStyle={styles.optionsContainer}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.key}
                        style={[styles.card, {
                            backgroundColor: tc.bgCard,
                            borderColor: tc.borderLight,
                        }]}
                        onPress={() => handleSelection(role.key)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: role.bgColor }]}>
                            <role.icon size={32} color={role.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, { color: tc.text }]}>{role.title}</Text>
                            <Text style={[styles.cardDesc, { color: tc.textSecondary }]}>{role.desc}</Text>
                        </View>
                        <ChevronRight size={24} color={tc.textMuted} />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: tc.textMuted }]}>
                    Al continuar, aceptás nuestros <Text style={{ color: colors.primary.DEFAULT, fontWeight: '600' }}>Términos y Condiciones</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    header: { marginTop: 20, marginBottom: 40 },
    emoji: { fontSize: 40, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '900', lineHeight: 38, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 8 },
    optionsContainer: { gap: 16 },
    card: {
        borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1,
        ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 12px rgba(0,0,0,0.06)' } : {}),
    },
    iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    cardDesc: { fontSize: 14, lineHeight: 20 },
    footer: { marginTop: 'auto', alignItems: 'center', marginBottom: 10 },
    footerText: { fontSize: 12, textAlign: 'center' },
});
