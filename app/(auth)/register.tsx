// Register Screen - Dark Mode Premium
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { signUp, isLoading } = useAuthStore();
    const tc = useThemeColors();

    const handleRegister = async () => {
        setError('');
        if (!fullName || !email || !password || !confirmPassword) { setError('Por favor completa todos los campos'); return; }
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        const { data, error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) {
            const msg = signUpError.message || '';
            if (msg.includes('already registered') || msg.includes('already exists')) setError('Este email ya está registrado.');
            else if (msg.includes('rate') || msg.includes('429') || msg.includes('too many')) setError('Demasiados intentos. Espera unos minutos.');
            else setError(msg || 'Error al crear la cuenta.');
            return;
        }
        if (data && !data.session) {
            alert('Cuenta creada. Por favor verifica tu email antes de iniciar sesión.');
            router.replace('/(auth)/login');
            return;
        }
        router.replace('/(tabs)');
    };

    const iconColor = tc.isDark ? colors.gray[400] : colors.gray[400];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[
                        styles.formCard,
                        isDesktop && [styles.formCardDesktop, {
                            backgroundColor: tc.isDark ? 'rgba(35,30,27,0.85)' : 'rgba(255,255,255,0.92)',
                            borderColor: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        }],
                    ]}>
                        {/* Back */}
                        <TouchableOpacity style={[styles.backButton, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : colors.gray[100] }]} onPress={() => router.back()}>
                            <ArrowLeft size={22} color={tc.text} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: tc.text }]}>Crear Cuenta</Text>
                            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Únete a la comunidad de Un Pique</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {error ? (
                                <View style={[styles.errorContainer, { backgroundColor: tc.isDark ? 'rgba(239,68,68,0.12)' : colors.danger + '12' }]}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <Input label="Nombre Completo" placeholder="Juan Pérez" value={fullName} onChangeText={setFullName} autoCapitalize="words" leftIcon={<User size={20} color={iconColor} />} />
                            <Input label="Email" placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon={<Mail size={20} color={iconColor} />} />
                            <Input label="Contraseña" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} leftIcon={<Lock size={20} color={iconColor} />}
                                rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} color={iconColor} /> : <Eye size={20} color={iconColor} />}</TouchableOpacity>} />
                            <Input label="Confirmar Contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} leftIcon={<Lock size={20} color={iconColor} />} />

                            <Button title="Crear Cuenta" onPress={handleRegister} loading={isLoading} fullWidth style={{ marginTop: 8 }} />
                        </View>

                        <Text style={[styles.terms, { color: tc.textMuted }]}>
                            Al registrarte, aceptas nuestros <Text style={{ color: colors.primary.DEFAULT, fontWeight: '500' }}>Términos</Text> y <Text style={{ color: colors.primary.DEFAULT, fontWeight: '500' }}>Privacidad</Text>
                        </Text>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: tc.textSecondary }]}>¿Ya tienes cuenta?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={[styles.loginLink, { color: colors.primary.DEFAULT }]}> Inicia Sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
    scrollContentDesktop: { justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    formCard: { width: '100%' },
    formCardDesktop: {
        maxWidth: 480, borderRadius: 24, padding: 40, borderWidth: 1,
        boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any : {}),
    },
    backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    header: { marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 8 },
    form: { marginBottom: 16 },
    errorContainer: { padding: 12, borderRadius: 12, marginBottom: 16 },
    errorText: { color: colors.danger, fontSize: 14, textAlign: 'center', fontWeight: '500' },
    terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 15 },
    loginLink: { fontSize: 15, fontWeight: '700' },
});
