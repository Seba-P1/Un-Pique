// Configuración — Corregido: componentes extraídos fuera del render
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, Moon, Bell, Shield, HelpCircle, Info, ChevronRight,
    Globe, Trash2, User, Lock, CreditCard, Mail, Volume2
} from 'lucide-react-native';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/themeStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { showAlert } from '../utils/alert';

const renderIcon = (IconComp: any, color: string, size = 20) => <IconComp size={size} color={color} />;

// ─── Componentes extraídos FUERA del render para evitar "Element type is invalid" ───

function SettingSwitch({ icon, iconBg, iconColor, label, value, onToggle, tc }: any) {
    return (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    {renderIcon(icon, iconColor)}
                </View>
                <Text style={[styles.rowLabel, { color: tc.text }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: tc.isDark ? '#4B5563' : '#E5E7EB', true: colors.primary.DEFAULT }}
                thumbColor="#fff"
            />
        </View>
    );
}

function SettingLink({ icon, iconBg, iconColor, label, detail, onPress, danger, tc }: any) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress}>
            <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    {renderIcon(icon, iconColor)}
                </View>
                <Text style={[styles.rowLabel, { color: danger ? colors.danger : tc.text }]}>{label}</Text>
            </View>
            <View style={styles.rowRight}>
                {detail ? <Text style={[styles.rowDetail, { color: tc.textMuted }]}>{detail}</Text> : null}
                <ChevronRight size={20} color={tc.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

function SettingDivider({ tc }: any) {
    return <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />;
}

// ─── Pantalla principal ───

export default function SettingsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { theme, setTheme } = useThemeStore();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Configuración</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 600, alignSelf: 'center' as const, width: '100%' }]}>
                {/* CUENTA */}
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>CUENTA</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingLink tc={tc} icon={User} iconBg={tc.isDark ? '#1E3A5F' : '#E0F2FE'} iconColor={colors.info} label="Editar perfil" onPress={() => router.push('/(tabs)/profile' as any)} />
                    <SettingDivider tc={tc} />
                    <SettingLink tc={tc} icon={Lock} iconBg={tc.isDark ? '#3B1F5E' : '#F3E8FF'} iconColor="#9333EA" label="Cambiar contraseña" onPress={() => showAlert('Cambiar contraseña', 'Te enviaremos un email con instrucciones para cambiar tu contraseña.')} />
                    <SettingDivider tc={tc} />
                    <SettingLink tc={tc} icon={CreditCard} iconBg={tc.isDark ? '#1A3A2A' : '#DCFCE7'} iconColor={colors.success} label="Métodos de pago" onPress={() => showAlert('Métodos de pago', 'Próximamente podrás agregar y gestionar tus tarjetas y métodos de pago.')} />
                </View>

                {/* NOTIFICACIONES */}
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>NOTIFICACIONES</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingSwitch tc={tc} icon={Bell} iconBg={tc.isDark ? '#1E3A5F' : '#E0F2FE'} iconColor={colors.info} label="Notificaciones Push" value={notificationsEnabled} onToggle={setNotificationsEnabled} />
                    <SettingDivider tc={tc} />
                    <SettingSwitch tc={tc} icon={Mail} iconBg={tc.isDark ? '#3D2E0A' : '#FEF3C7'} iconColor={colors.warning} label="Notificaciones por Email" value={emailNotifications} onToggle={setEmailNotifications} />
                    <SettingDivider tc={tc} />
                    <SettingSwitch tc={tc} icon={Volume2} iconBg={tc.isDark ? '#1A3A2A' : '#DCFCE7'} iconColor={colors.success} label="Sonidos" value={soundEnabled} onToggle={setSoundEnabled} />
                </View>

                {/* APARIENCIA */}
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>APARIENCIA</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingSwitch tc={tc} icon={Moon} iconBg={tc.isDark ? '#3B1F5E' : '#F3E8FF'} iconColor="#9333EA" label="Modo Oscuro" value={theme === 'dark'} onToggle={toggleTheme} />
                    <SettingDivider tc={tc} />
                    <SettingLink tc={tc} icon={Globe} iconBg={tc.isDark ? '#2D3748' : '#F4F5F7'} iconColor={tc.isDark ? '#ccc' : '#555'} label="Idioma" detail="Español" onPress={() => showAlert('Idioma', 'Actualmente solo Español está disponible.')} />
                </View>

                {/* SEGURIDAD */}
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>SEGURIDAD</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingSwitch tc={tc} icon={Shield} iconBg={tc.isDark ? '#1A3A2A' : '#DCFCE7'} iconColor={colors.success} label="Biometría (FaceID/TouchID)" value={biometricsEnabled} onToggle={setBiometricsEnabled} />
                </View>

                {/* SOPORTE */}
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>SOPORTE</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingLink tc={tc} icon={HelpCircle} iconBg={tc.isDark ? '#3D2E0A' : '#FEF3C7'} iconColor={colors.warning} label="Centro de Ayuda" onPress={() => router.push('/help' as any)} />
                    <SettingDivider tc={tc} />
                    <SettingLink tc={tc} icon={Info} iconBg={tc.isDark ? '#2D3748' : '#F4F5F7'} iconColor={tc.isDark ? '#ccc' : '#555'} label="Acerca de Un Pique" onPress={() => showAlert('Un Pique', 'Versión 1.0.0 (Build 100)\n\nTodo tu barrio, en una app.\n\n© 2024 Un Pique.')} />
                    <SettingDivider tc={tc} />
                    <SettingLink tc={tc} icon={Globe} iconBg={tc.isDark ? '#1E3A5F' : '#E0F2FE'} iconColor={colors.info} label="Política de Privacidad" onPress={() => showAlert('Privacidad', 'La política de privacidad estará disponible próximamente.')} />
                </View>

                {/* ZONA PELIGROSA */}
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>ZONA PELIGROSA</Text>
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <SettingLink tc={tc} icon={Trash2} iconBg={tc.isDark ? '#3B1010' : '#FEE2E2'} iconColor={colors.danger} label="Eliminar mi cuenta" danger onPress={() => showAlert('Eliminar cuenta', '¿Estás seguro? Contactá a soporte para proceder con la eliminación.')} />
                </View>

                <Text style={[styles.version, { color: tc.textMuted }]}>v1.0.0 (Build 100)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16, marginLeft: 4, letterSpacing: 1, fontFamily: 'Nunito Sans' },
    section: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { fontSize: 15, fontWeight: '500', fontFamily: 'Nunito Sans' },
    rowDetail: { fontSize: 13, fontFamily: 'Nunito Sans' },
    divider: { height: 1, marginLeft: 64 },
    version: { textAlign: 'center', marginTop: 32, marginBottom: 20, fontSize: 12, fontFamily: 'Nunito Sans' },
});
