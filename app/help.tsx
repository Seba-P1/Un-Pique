// Centro de Ayuda — Completo con secciones, FAQs, y contacto
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Linking, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, ChevronDown, ChevronUp, Search, ShoppingCart, Truck,
    CreditCard, User, Shield, HelpCircle, MessageCircle, Mail, Phone,
    Star, Store, Settings, MapPin
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import colors from '../constants/colors';
import { showAlert } from '../utils/alert';

const renderIcon = (Icon: any, size: number, color: string) => <Icon size={size} color={color} />;

interface FAQ { q: string; a: string; }
interface Section { title: string; icon: any; iconColor: string; faqs: FAQ[]; }

const HELP_SECTIONS: Section[] = [
    {
        title: 'Pedidos y Delivery',
        icon: ShoppingCart,
        iconColor: colors.primary.DEFAULT,
        faqs: [
            { q: '¿Cómo hago un pedido?', a: 'Ingresá a un restaurante o tienda desde la pestaña de Delivery, elegí tus productos, agregalos al carrito y completá el checkout eligiendo dirección de entrega y método de pago.' },
            { q: '¿Cuánto tarda un pedido?', a: 'El tiempo estimado depende del comercio y la distancia. Generalmente entre 20 y 45 minutos para delivery.' },
            { q: '¿Puedo cancelar un pedido?', a: 'Podés cancelar un pedido siempre y cuando el comercio aún no haya comenzado a prepararlo. Desde "Mis Pedidos" tocá el pedido activo y seleccioná "Cancelar".' },
            { q: '¿Cómo hago seguimiento de mi pedido?', a: 'En "Mis Pedidos" podés ver el estado en tiempo real de tus pedidos activos: Confirmado → En preparación → En camino → Entregado.' },
            { q: '¿Puedo programar un pedido?', a: 'Actualmente no. Esta funcionalidad estará disponible próximamente.' },
        ]
    },
    {
        title: 'Repartidores',
        icon: Truck,
        iconColor: '#06B6D4',
        faqs: [
            { q: '¿Cómo me registro como repartidor?', a: 'Desde tu perfil, accedé al "Panel de Repartidor" y seguí los pasos de registro. Necesitás DNI, licencia de conducir vigente, y un vehículo propio.' },
            { q: '¿Cuánto gana un repartidor?', a: 'Los repartidores ganan un monto por entrega realizada más un porcentaje de propinas. Las tarifas dependen de la distancia y horario.' },
            { q: '¿Puedo elegir mis horarios?', a: 'Sí. Comme repartidor sos independiente y elegís cuándo conectarte para recibir pedidos.' },
            { q: '¿Qué vehículos se aceptan?', a: 'Bicicleta, moto, auto. Cada tipo tiene tarifas y alcance de distancia diferentes.' },
        ]
    },
    {
        title: 'Pagos y Facturación',
        icon: CreditCard,
        iconColor: '#10B981',
        faqs: [
            { q: '¿Qué métodos de pago se aceptan?', a: 'Aceptamos Mercado Pago, tarjetas de crédito/débito, y efectivo al momento de la entrega.' },
            { q: '¿Es seguro pagar en la app?', a: 'Sí. Todas las transacciones se procesan a través de Mercado Pago, que cuenta con certificaciones de seguridad internacionales. No almacenamos datos sensibles de tarjetas.' },
            { q: '¿Puedo solicitar factura?', a: 'Si necesitás factura, contactanos por email con los datos fiscales y el número de pedido.' },
            { q: '¿Cómo funciona la propina?', a: 'Al finalizar tu pedido podés dejar una propina voluntaria al repartidor. El 100% de la propina va al repartidor.' },
        ]
    },
    {
        title: 'Socios Comerciales',
        icon: Store,
        iconColor: '#8B5CF6',
        faqs: [
            { q: '¿Cómo registro mi comercio?', a: 'Desde tu perfil, accedé a "Panel de Vendedor" → "Crear cuenta de socio". Completá los datos de tu negocio, subí fotos, configurá tu menú/catálogo y horarios.' },
            { q: '¿Qué comisión cobra Un Pique?', a: 'La comisión base es del 12% por pedido concretado. Los primeros 30 días son sin comisión para nuevos socios.' },
            { q: '¿Puedo modificar mis horarios?', a: 'Sí. Desde "Panel de Vendedor" → "Configuración de tienda" → "Horarios" podés programar apertura y cierre por día, turnos, y también abrir/cerrar manualmente sin modificar la programación.' },
            { q: '¿Cómo funciona la publicidad?', a: 'Ofrecemos banners destacados, posicionamiento premium en el feed, y stories patrocinadas. Los costos varían según duración y alcance. Contactanos para un presupuesto personalizado.' },
            { q: '¿Puedo ver mis estadísticas de ventas?', a: 'Sí. El Panel de Vendedor incluye dashboard con KPIs, gráficos de ventas, reporte de pedidos, y analíticas detalladas.' },
        ]
    },
    {
        title: 'Cuenta y Perfil',
        icon: User,
        iconColor: '#F59E0B',
        faqs: [
            { q: '¿Cómo cambio mi contraseña?', a: 'Desde Configuración → Cuenta → "Cambiar contraseña". Te enviaremos un email con instrucciones.' },
            { q: '¿Cómo elimino mi cuenta?', a: 'Desde Configuración → Zona Peligrosa → "Eliminar mi cuenta". Esta acción es irreversible y elimina todos tus datos, pedidos e historial.' },
            { q: '¿Puedo tener múltiples direcciones?', a: 'Sí. En "Mis Direcciones" podés agregar tantas como necesites y elegir una como predeterminada.' },
            { q: '¿Cómo edito mi perfil?', a: 'Desde la pestaña "Perfil" podés cambiar tu foto, nombre, email, teléfono y preferencias.' },
        ]
    },
    {
        title: 'Alojamiento',
        icon: MapPin,
        iconColor: '#EC4899',
        faqs: [
            { q: '¿Cómo reservo un alojamiento?', a: 'Ingresá a la sección "Alojamiento", elegí el hotel/cabaña que te interese, seleccioná una fecha en el calendario y contactá al alojamiento por WhatsApp, email o teléfono para consultar disponibilidad.' },
            { q: '¿Un Pique gestiona las reservas?', a: 'No. Un Pique funciona como un directorio. La reserva y el pago se coordinan directamente con el alojamiento.' },
            { q: '¿Cómo registro mi alojamiento?', a: 'Contactanos por email a socios@unpique.com con los datos de tu alojamiento y te daremos de alta en la plataforma.' },
        ]
    },
    {
        title: 'Servicios Profesionales',
        icon: Settings,
        iconColor: '#64748B',
        faqs: [
            { q: '¿Cómo contrato un servicio?', a: 'En la sección "Servicios", explorá las categorías disponibles (Plomería, Electricidad, etc.), y contactá al profesional que necesites.' },
            { q: '¿Cómo me registro como profesional?', a: 'Tocá sobre cualquier categoría de servicio y elegí "Registrarme como socio". Completá tu perfil con experiencia, zona de cobertura y tarifas.' },
            { q: '¿Un Pique cobra comisión a profesionales?', a: 'Los profesionales tienen un plan gratuito con visibilidad básica. Los planes premium ofrecen mayor visibilidad y herramientas avanzadas.' },
        ]
    },
    {
        title: 'Seguridad y Privacidad',
        icon: Shield,
        iconColor: '#EF4444',
        faqs: [
            { q: '¿Mis datos están seguros?', a: 'Sí. Utilizamos encriptación end-to-end, autenticación de Firebase, y cumplimos con las regulaciones de protección de datos personales vigentes.' },
            { q: '¿Puedo activar biometría?', a: 'Sí. Desde Configuración → Seguridad podés activar FaceID o TouchID para un acceso más seguro.' },
            { q: '¿Comparten mis datos con terceros?', a: 'No compartimos datos personales con terceros. Solo compartimos la información necesaria con el comercio para completar tu pedido.' },
        ]
    },
];

export default function HelpScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [expandedSection, setExpandedSection] = useState<number | null>(0);
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSections = searchTerm.trim().length > 0
        ? HELP_SECTIONS.map(s => ({
            ...s,
            faqs: s.faqs.filter(f =>
                f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.a.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(s => s.faqs.length > 0)
        : HELP_SECTIONS;

    const toggleFaq = (key: string) => setExpandedFaq(expandedFaq === key ? null : key);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Centro de Ayuda</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 700, alignSelf: 'center', width: '100%' }]}>
                {/* Hero */}
                <View style={[styles.hero, { backgroundColor: colors.primary.DEFAULT }]}>
                    <HelpCircle size={40} color="#fff" />
                    <Text style={styles.heroTitle}>¿En qué podemos ayudarte?</Text>
                    <Text style={styles.heroSub}>Buscá entre nuestras preguntas frecuentes o contactanos directamente</Text>
                </View>

                {/* Buscador */}
                <View style={[styles.searchBar, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Search size={18} color={tc.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: tc.text }]}
                        placeholder="Buscar en preguntas frecuentes..."
                        placeholderTextColor={tc.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {/* Secciones */}
                {filteredSections.map((section, si) => (
                    <View key={si} style={[styles.sectionCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpandedSection(expandedSection === si ? null : si)}>
                            <View style={styles.sectionLeft}>
                                <View style={[styles.sectionIcon, { backgroundColor: section.iconColor + '20' }]}>
                                    {renderIcon(section.icon, 20, section.iconColor)}
                                </View>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>{section.title}</Text>
                            </View>
                            {expandedSection === si
                                ? <ChevronUp size={20} color={tc.textMuted} />
                                : <ChevronDown size={20} color={tc.textMuted} />
                            }
                        </TouchableOpacity>

                        {expandedSection === si && section.faqs.map((faq, fi) => {
                            const key = `${si}-${fi}`;
                            return (
                                <View key={fi} style={[styles.faqItem, { borderTopColor: tc.borderLight }]}>
                                    <TouchableOpacity style={styles.faqQ} onPress={() => toggleFaq(key)}>
                                        <Text style={[styles.faqQText, { color: tc.text }]}>{faq.q}</Text>
                                        {expandedFaq === key
                                            ? <ChevronUp size={16} color={tc.textMuted} />
                                            : <ChevronDown size={16} color={tc.textMuted} />
                                        }
                                    </TouchableOpacity>
                                    {expandedFaq === key && (
                                        <Text style={[styles.faqAText, { color: tc.textSecondary }]}>{faq.a}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}

                {/* Contacto */}
                <View style={[styles.contactSection, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.contactTitle, { color: tc.text }]}>¿No encontraste lo que buscabas?</Text>
                    <Text style={[styles.contactSub, { color: tc.textMuted }]}>Nuestro equipo está disponible para ayudarte</Text>

                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={() => showAlert('WhatsApp', 'Se abriría WhatsApp de soporte: +54 9 3821 000000')}>
                        <MessageCircle size={18} color="#fff" />
                        <Text style={styles.contactBtnText}>WhatsApp Soporte</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.info }]} onPress={() => showAlert('Email', 'Enviá tu consulta a soporte@unpique.com')}>
                        <Mail size={18} color="#fff" />
                        <Text style={styles.contactBtnText}>soporte@unpique.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: tc.isDark ? '#333' : '#eee' }]} onPress={() => showAlert('Teléfono', 'Llamanos: 0800-UN-PIQUE')}>
                        <Phone size={18} color={tc.text} />
                        <Text style={[styles.contactBtnText, { color: tc.text }]}>0800-UN-PIQUE</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.footer, { color: tc.textMuted }]}>Un Pique v1.0.0 · Todo tu barrio, en una app.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, gap: 12 },
    // Hero
    hero: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, marginBottom: 4 },
    heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center' },
    // Search
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, gap: 8, height: 44 },
    searchInput: { flex: 1, fontSize: 14, height: '100%' },
    // Section
    sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    sectionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    // FAQ
    faqItem: { borderTopWidth: 0.5, paddingHorizontal: 16 },
    faqQ: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    faqQText: { fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 8 },
    faqAText: { fontSize: 13, lineHeight: 20, paddingBottom: 14 },
    // Contact
    contactSection: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 10, marginTop: 8 },
    contactTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
    contactSub: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
    contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14 },
    contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    footer: { textAlign: 'center', fontSize: 12, marginTop: 16, marginBottom: 20 },
});
