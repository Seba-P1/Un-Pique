// Seller Product Management Screen - Based on Stitch gestión_de_productos design
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, MoreVertical, ArrowLeft, Package } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

// Mock products
const MOCK_PRODUCTS = [
    { id: '1', name: 'Croissant de Mantequilla', price: 2.50, stock: 25, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?q=80&w=400' },
    { id: '2', name: 'Pan de Masa Madre', price: 5.00, stock: 15, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400' },
    { id: '3', name: 'Tarta de Manzana', price: 12.75, stock: 8, image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?q=80&w=400' },
    { id: '4', name: 'Galleta con Chispas', price: 1.50, stock: 50, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=400' },
    { id: '5', name: 'Brownie de Chocolate', price: 3.00, stock: 30, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400' },
];

export default function ProductsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderProduct = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/business/products/add?id=${item.id}` as any)}
        >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: tc.text }]}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: tc.textSecondary }]}>${item.price.toFixed(2)}</Text>
                <Text style={[styles.productStock, { color: tc.textMuted }]}>Stock: {item.stock}</Text>
            </View>
            <TouchableOpacity style={styles.moreButton} onPress={() => showAlert('Opciones', 'Editar / Eliminar')}>
                <MoreVertical size={24} color={tc.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { backgroundColor: tc.bg }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <ArrowLeft size={24} color={tc.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: tc.text }]}>Productos</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search */}
                    <View style={[styles.searchBar, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Search size={20} color={tc.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: tc.text }]}
                            placeholder="Buscar productos..."
                            placeholderTextColor={tc.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </SafeAreaView>

            {/* Product List */}
            <FlatList
                data={filtered}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Package size={64} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay productos</Text>
                    </View>
                }
            />

            {/* FAB - Add Product */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/business/products/add' as any)}
                activeOpacity={0.85}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
    },
    backBtn: { padding: 8 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito Sans',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        gap: 12,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
    },
    productInfo: {
        flex: 1,
        gap: 2,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    productPrice: {
        fontSize: 14,
        fontFamily: 'Nunito Sans',
    },
    productStock: {
        fontSize: 13,
        fontFamily: 'Nunito Sans',
    },
    moreButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
    },
});
