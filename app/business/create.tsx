import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, Home, ArrowLeft, CheckCircle2, Info } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import colors from '../../constants/colors';
import { AppHeader } from '../../components/ui/AppHeader';

export default function CreateBusinessScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { createBusiness } = useBusinessStore();

    // Form state
    const [vendorType, setVendorType] = useState<'formal' | 'vitrina' | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [vitrinaWhatsapp, setVitrinaWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animations
    const [formalScale] = useState(new Animated.Value(1));
    const [vitrinaScale] = useState(new Animated.Value(1));

    const animateSelect = (type: 'formal' | 'vitrina') => {
        Animated.sequence([
            Animated.timing(type === 'formal' ? formalScale : vitrinaScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(type === 'formal' ? formalScale : vitrinaScale, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
        setVendorType(type);
    };

    const handleCreate = async () => {
        if (!vendorType) {
            Alert.alert("Seleccioná un tipo", "Tenés que elegir si sos Negocio o Productor Independiente.");
            return;
        }
        if (!name.trim()) {
            Alert.alert("Nombre requerido", "Ingresá el nombre de tu negocio.");
            return;
        }

        let cleanWhatsapp = null;
        if (vendorType === 'vitrina') {
            cleanWhatsapp = vitrinaWhatsapp.replace(/\D/g, '');
            if (cleanWhatsapp.length < 8 || cleanWhatsapp.length > 15) {
                Alert.alert("WhatsApp inválido", "Ingresá un número válido (ej: 2983123456) sin símbolos.");
                return;
            }
        }

        setIsSubmitting(true);
        const success = await createBusiness({
            name,
            description,
            vendor_type: vendorType,
            vitrina_whatsapp: cleanWhatsapp,
        });
        setIsSubmitting(false);

        if (success) {
            Alert.alert(
                "¡Éxito!", 
                "Tu negocio fue creado exitosamente." + (vendorType === 'vitrina' ? "\n\nTus clientes te contactarán por WhatsApp cuando quieran hacer un pedido." : ""),
                [
                    { 
                        text: "Ir a mi Panel", 
                        onPress: () => router.replace('/business/dashboard' as any) 
                    }
                ]
            );
        } else {
            Alert.alert("Error", "Hubo un problema al crear el negocio. Intentá de nuevo.");
        }
    };

    const isDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader
                title="Registrar mi Negocio"
                leftIcon="back"
            />

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: tc.text }]}>¿Cómo trabajás?</Text>
                <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
                    Elegí el tipo de perfil que mejor se adapte a lo que hacés. Podés cambiar de plan más adelante.
                </Text>

                <View style={styles.cardsContainer}>
                    {/* CARD FORMAL */}
                    <Animated.View style={[{ transform: [{ scale: formalScale }] }, isDesktop && { flex: 1 }]}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => animateSelect('formal')}
                            style={[
                                styles.card,
                                { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
                                vendorType === 'formal' && styles.cardFormalActive,
                                vendorType === 'formal' && { backgroundColor: 'rgba(255, 107, 53, 0.05)' }
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: vendorType === 'formal' ? '#FF6B35' : tc.borderLight }]}>
                                    <Store size={24} color={vendorType === 'formal' ? '#FFF' : tc.textMuted} />
                                </View>
                                {vendorType === 'formal' && <CheckCircle2 size={24} color="#FF6B35" />}
                            </View>
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Negocio o Local</Text>
                            <Text style={[styles.cardDesc, { color: tc.textSecondary }]}>
                                Tengo CUIT o monotributo. Mis clientes pagan desde la app.
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* CARD VITRINA */}
                    <Animated.View style={[{ transform: [{ scale: vitrinaScale }] }, isDesktop && { flex: 1 }]}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => animateSelect('vitrina')}
                            style={[
                                styles.card,
                                { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
                                vendorType === 'vitrina' && styles.cardVitrinaActive,
                                vendorType === 'vitrina' && { backgroundColor: 'rgba(34, 197, 94, 0.05)' }
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: vendorType === 'vitrina' ? '#22c55e' : tc.borderLight }]}>
                                    <Home size={24} color={vendorType === 'vitrina' ? '#FFF' : tc.textMuted} />
                                </View>
                                {vendorType === 'vitrina' && <CheckCircle2 size={24} color="#22c55e" />}
                            </View>
                            <Text style={[styles.cardTitle, { color: tc.text }]}>Productor Independiente</Text>
                            <Text style={[styles.cardDesc, { color: tc.textSecondary }]}>
                                Vendo desde casa. Mis clientes me contactan por WhatsApp.
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {vendorType && (
                    <View style={styles.formContainer}>
                        <Text style={[styles.sectionTitle, { color: tc.text }]}>Datos Básicos</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: tc.text }]}>Nombre de tu negocio/emprendimiento</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tc.bgCard, color: tc.text, borderColor: tc.borderLight, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any }]}
                                placeholder="Ej: Las Empanadas de María"
                                placeholderTextColor={tc.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: tc.text }]}>¿Qué vendés? (Descripción breve)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: tc.bgCard, color: tc.text, borderColor: tc.borderLight, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any }]}
                                placeholder="Describí tus productos principales..."
                                placeholderTextColor={tc.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {vendorType === 'vitrina' && (
                            <View style={styles.vitrinaSection}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: tc.text }]}>Tu número de WhatsApp</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tc.bgCard, color: tc.text, borderColor: tc.borderLight, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any }]}
                                        placeholder="Ej: 2983123456"
                                        placeholderTextColor={tc.textMuted}
                                        value={vitrinaWhatsapp}
                                        onChangeText={(text) => setVitrinaWhatsapp(text.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                        maxLength={15}
                                    />
                                    <Text style={[styles.hint, { color: tc.textMuted }]}>Solo números, sin espacios ni guiones ni +54.</Text>
                                </View>

                                <View style={styles.infoBanner}>
                                    <Info size={20} color="#0284c7" style={{ marginTop: 2 }} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.infoTitle}>Información Importante</Text>
                                        <Text style={styles.infoDesc}>No necesitás CUIT ni monotributo para registrarte. Los pagos y entregas los acordás vos directamente con tu cliente.</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        
                        <TouchableOpacity
                            style={[styles.submitBtn, { opacity: (name.trim() && (vendorType !== 'vitrina' || vitrinaWhatsapp.length >= 8)) ? 1 : 0.5 }]}
                            onPress={handleCreate}
                            disabled={isSubmitting || !name.trim() || (vendorType === 'vitrina' && vitrinaWhatsapp.length < 8)}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>Crear Negocio Ahora</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    desktopContent: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    cardsContainer: {
        gap: 16,
        marginBottom: 32,
        ...(Platform.OS === 'web' && window.innerWidth >= 768 ? { flexDirection: 'row' as any } : {})
    },
    card: {
        borderWidth: 2,
        borderRadius: 20,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    cardFormalActive: {
        borderColor: '#FF6B35',
    },
    cardVitrinaActive: {
        borderColor: '#22c55e',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    formContainer: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    vitrinaSection: {
        marginTop: 12,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    infoTitle: {
        color: '#0284c7',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
    },
    infoDesc: {
        color: '#0369a1',
        fontSize: 14,
        lineHeight: 20,
    },
    submitBtn: {
        backgroundColor: '#FF6B35',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    }
});
