import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, Package } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';
import { Card } from '../../components/ui';
import { useBusinessStore } from '../../stores/businessStore';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    is_available: boolean;
}

export default function BusinessMenuScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data - will be replaced with real fetch
        setTimeout(() => {
            setProducts([
                { id: '1', name: 'Whopper Doble', description: 'Doble carne con queso', price: 8500, category: 'Hamburguesas', is_available: true },
                { id: '2', name: 'Nuggets x10', description: 'Nuggets de pollo crujientes', price: 4200, category: 'Snacks', is_available: true },
                { id: '3', name: 'Papas Grandes', description: 'Papas fritas tamaño grande', price: 2800, category: 'Acompañamientos', is_available: false },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const handleDelete = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        showAlert('Eliminado', 'Producto eliminado correctamente.');
    };

    const toggleAvailability = (id: string) => {
        setProducts(prev =>
            prev.map(p => p.id === id ? { ...p, is_available: !p.is_available } : p)
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Mi Menú</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => showAlert('Próximamente', 'La función de agregar producto estará disponible pronto.')}
                >
                    <Plus size={24} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package size={64} color={colors.gray[300]} />
                    <Text style={styles.emptyTitle}>Sin productos</Text>
                    <Text style={styles.emptyText}>Agregá tu primer producto al menú</Text>
                    <TouchableOpacity style={styles.addFirstButton}>
                        <Plus size={20} color={colors.white} />
                        <Text style={styles.addFirstButtonText}>Agregar Producto</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {products.map((product) => (
                        <Card key={product.id} variant="elevated" style={styles.productCard}>
                            <View style={styles.productInfo}>
                                <View style={styles.productHeader}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.availabilityBadge,
                                            { backgroundColor: product.is_available ? colors.success + '20' : colors.gray[200] }
                                        ]}
                                        onPress={() => toggleAvailability(product.id)}
                                    >
                                        <Text style={[
                                            styles.availabilityText,
                                            { color: product.is_available ? colors.success : colors.gray[500] }
                                        ]}>
                                            {product.is_available ? 'Disponible' : 'Agotado'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.productDescription}>{product.description}</Text>
                                <View style={styles.productFooter}>
                                    <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
                                    <Text style={styles.productCategory}>{product.category}</Text>
                                </View>
                            </View>
                            <View style={styles.productActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => showAlert('Próximamente', 'La edición de productos estará disponible pronto.')}
                                >
                                    <Edit2 size={18} color={colors.gray[600]} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleDelete(product.id)}
                                >
                                    <Trash2 size={18} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray[900],
    },
    addButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 20,
        fontWeight: '600',
        color: colors.gray[900],
        marginTop: 16,
    },
    emptyText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.gray[500],
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    addFirstButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.DEFAULT,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    addFirstButtonText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
    content: {
        padding: 16,
    },
    productCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
    },
    productInfo: {
        flex: 1,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    productName: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray[900],
        flex: 1,
    },
    availabilityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    availabilityText: {
        fontFamily: 'Nunito Sans',
        fontSize: 11,
        fontWeight: '600',
    },
    productDescription: {
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        color: colors.gray[500],
        marginBottom: 8,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontFamily: 'Nunito Sans',
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary.DEFAULT,
    },
    productCategory: {
        fontFamily: 'Nunito Sans',
        fontSize: 12,
        color: colors.gray[400],
    },
    productActions: {
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
        marginLeft: 12,
    },
    actionBtn: {
        padding: 8,
        backgroundColor: colors.gray[100],
        borderRadius: 8,
    },
});
