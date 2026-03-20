// Login Screen - Dark Mode Premium + Glassmorphism
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, Moon, Sun } from 'lucide-react-native';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const { signIn, isLoading } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const tc = useThemeColors();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) { setError('Por favor completa todos los campos'); return; }
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
            const msg = signInError.message || '';
            if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.');
            else if (msg.includes('Email not confirmed')) setError('Tu email no ha sido confirmado. Revisa tu bandeja.');
            else if (msg.includes('Too many requests') || msg.includes('429')) setError('Demasiados intentos. Espera unos minutos.');
            else setError(msg || 'Error al iniciar sesión.');
            return;
        }
        router.replace('/(tabs)');
    };

    const iconColor = tc.isDark ? colors.gray[400] : colors.gray[400];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]}>
            {/* Theme Toggle */}
            <TouchableOpacity
                style={[styles.themeToggle, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                onPress={toggleTheme}
            >
                {theme === 'dark' ? <Sun size={22} color="#FFB800" /> : <Moon size={22} color={colors.primary.DEFAULT} />}
            </TouchableOpacity>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Card — Glassmorphism on desktop */}
                    <View style={[
                        styles.formCard,
                        isDesktop && [styles.formCardDesktop, {
                            backgroundColor: tc.isDark ? 'rgba(35,30,27,0.85)' : 'rgba(255,255,255,0.92)',
                            borderColor: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        }],
                        !isDesktop && { backgroundColor: 'transparent' },
                    ]}>
                        {/* Logo */}
                        <View style={styles.header}>
                            {Platform.OS === 'web' ? (
                                <img
                                    src="/logo-unpique.svg"
                                    alt="Un Pique"
                                    style={{ width: 80, height: 96, objectFit: 'contain', marginBottom: 16 }}
                                />
                            ) : (
                                <ExpoImage
                                    source={require('../../assets/logo-unpique.svg')}
                                    style={{ width: 80, height: 96, marginBottom: 16 }}
                                    contentFit="contain"
                                />
                            )}
                            <Text style={[styles.title, { color: tc.text }]}>Iniciá sesión</Text>
                            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Bienvenido de vuelta</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {error ? (
                                <View style={[styles.errorContainer, { backgroundColor: tc.isDark ? 'rgba(239,68,68,0.12)' : colors.danger + '12' }]}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <Input
                                label="Email"
                                placeholder="tu@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                leftIcon={<Mail size={20} color={iconColor} />}
                            />

                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                leftIcon={<Lock size={20} color={iconColor} />}
                                rightIcon={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color={iconColor} /> : <Eye size={20} color={iconColor} />}
                                    </TouchableOpacity>
                                }
                            />

                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, { color: colors.primary.DEFAULT }]}>Olvidé mi contraseña</Text>
                            </TouchableOpacity>

                            <Button title="Iniciar Sesión" onPress={handleLogin} loading={isLoading} fullWidth />
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: tc.textSecondary }]}>¿No tienes cuenta?</Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                <Text style={[styles.registerLink, { color: colors.primary.DEFAULT }]}> Regístrate</Text>
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
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
    scrollContentDesktop: { justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    formCard: { width: '100%' },
    formCardDesktop: {
        width: 440, maxWidth: '100%', borderRadius: 24, padding: 40,
        borderWidth: 1, alignSelf: 'center',
        boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any : {}),
    },
    header: { alignItems: 'center', marginBottom: 36 },
    title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 6 },
    form: { marginBottom: 24 },
    errorContainer: { padding: 12, borderRadius: 12, marginBottom: 16 },
    errorText: { color: colors.danger, fontSize: 14, textAlign: 'center', fontWeight: '500' },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotPasswordText: { fontSize: 14, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    footerText: { fontSize: 15 },
    registerLink: { fontSize: 15, fontWeight: '700' },
    themeToggle: {
        position: 'absolute', top: Platform.OS === 'web' ? 20 : 50, right: 20, zIndex: 10,
        width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    },
});
