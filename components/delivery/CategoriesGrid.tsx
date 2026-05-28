import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

// ─── Static require() for each category image ───────────────────
// React Native requires static string literals in require() calls.
// These PNGs were converted from the SVGs in public/.
const CATEGORIES: { id: string; name: string; image: ImageSourcePropType; route: string }[] = [
    {
        id: '1',
        name: 'Hamburguesas',
        image: require('../../assets/images/categories/hamburguesas.png'),
        route: '/delivery/hamburguesas',
    },
    {
        id: '2',
        name: 'Pizzas',
        image: require('../../assets/images/categories/pizzas.png'),
        route: '/delivery/pizzas',
    },
    {
        id: '3',
        name: 'Empanadas',
        image: require('../../assets/images/categories/empanadas.png'),
        route: '/delivery/empanadas',
    },
    {
        id: '4',
        name: 'Lomitos',
        image: require('../../assets/images/categories/lomitos.png'),
        route: '/delivery/lomitos',
    },
    {
        id: '5',
        name: 'Milanesas',
        image: require('../../assets/images/categories/milanesas.png'),
        route: '/delivery/milanesas',
    },
    {
        id: '6',
        name: 'Sushi',
        image: require('../../assets/images/categories/sushi.png'),
        route: '/delivery/sushi',
    },
    {
        id: '7',
        name: 'Pastas',
        image: require('../../assets/images/categories/pastas.png'),
        route: '/delivery/pastas',
    },
    {
        id: '8',
        name: 'Carnes',
        image: require('../../assets/images/categories/carnes.png'),
        route: '/delivery/carnes',
    },
    {
        id: '9',
        name: 'Pescados',
        image: require('../../assets/images/categories/pescados.png'),
        route: '/delivery/pescados',
    },
    {
        id: '10',
        name: 'Sandwiches',
        image: require('../../assets/images/categories/sandwiches.png'),
        route: '/delivery/sandwiches',
    },
    {
        id: '11',
        name: 'Panchos',
        image: require('../../assets/images/categories/panchos.png'),
        route: '/delivery/panchos',
    },
    {
        id: '12',
        name: 'Burritos',
        image: require('../../assets/images/categories/burritos.png'),
        route: '/delivery/burritos',
    },
    {
        id: '13',
        name: 'Tortillas',
        image: require('../../assets/images/categories/tortillas.png'),
        route: '/delivery/tortillas',
    },
    {
        id: '14',
        name: 'Tartas',
        image: require('../../assets/images/categories/tartas.png'),
        route: '/delivery/tartas',
    },
    {
        id: '15',
        name: 'Papas Fritas',
        image: require('../../assets/images/categories/papas_fritas.png'),
        route: '/delivery/papas-fritas',
    },
    {
        id: '16',
        name: 'Guarniciones',
        image: require('../../assets/images/categories/guarniciones.png'),
        route: '/delivery/guarniciones',
    },
    {
        id: '17',
        name: 'Bebidas',
        image: require('../../assets/images/categories/bebidas.png'),
        route: '/delivery/bebidas',
    },
    {
        id: '18',
        name: 'Cafetería',
        image: require('../../assets/images/categories/cafeteria.png'),
        route: '/delivery/cafeteria',
    },
    {
        id: '19',
        name: 'Combos',
        image: require('../../assets/images/categories/combos.png'),
        route: '/delivery/combos',
    },
    {
        id: '20',
        name: 'Desayunos',
        image: require('../../assets/images/categories/desayunos.png'),
        route: '/delivery/desayunos',
    },
    {
        id: '21',
        name: 'Helados',
        image: require('../../assets/images/categories/helados.png'),
        route: '/delivery/helados',
    },
    {
        id: '22',
        name: 'Panadería',
        image: require('../../assets/images/categories/panaderia.png'),
        route: '/delivery/panaderia',
    },
    {
        id: '23',
        name: 'Picadas',
        image: require('../../assets/images/categories/picadas.png'),
        route: '/delivery/picadas',
    },
    {
        id: '24',
        name: 'Postres',
        image: require('../../assets/images/categories/postres.png'),
        route: '/delivery/postres',
    },
    {
        id: '25',
        name: 'Promociones',
        image: require('../../assets/images/categories/promociones.png'),
        route: '/delivery/promociones',
    },
    {
        id: '26',
        name: 'Sin TACC',
        image: require('../../assets/images/categories/sin-tacc.png'),
        route: '/delivery/sin-tacc',
    },
    {
        id: '27',
        name: 'Vegano',
        image: require('../../assets/images/categories/vegano.png'),
        route: '/delivery/vegano',
    },
];

// "Todo" category image
const TODO_IMAGE = require('../../assets/images/categories/todo.png');

interface CategoriesGridProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

export const CategoriesGrid = ({ selectedCategory, onSelectCategory }: CategoriesGridProps) => {
    const tc = useThemeColors();

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Categorías</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* "Todo" Category */}
                <TouchableOpacity
                    style={styles.categoryWrapper}
                    onPress={() => onSelectCategory('all')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.categoryRing,
                        selectedCategory === 'all' && styles.categoryRingSelected,
                    ]}>
                        <View style={[styles.categoryCircle, { backgroundColor: tc.bgCard }]}>
                            <Image
                                source={TODO_IMAGE}
                                style={styles.categoryImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                    <Text
                        style={[
                            styles.categoryLabel,
                            { color: selectedCategory === 'all' ? '#FF6B35' : tc.textSecondary },
                        ]}
                        numberOfLines={1}
                    >
                        Todo
                    </Text>
                </TouchableOpacity>

                {/* Category items */}
                {CATEGORIES.map((item) => {
                    const isSelected = selectedCategory === item.name;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.categoryWrapper}
                            onPress={() => onSelectCategory(item.name)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.categoryRing,
                                isSelected && styles.categoryRingSelected,
                            ]}>
                                <View style={[styles.categoryCircle, { backgroundColor: tc.bgCard }]}>
                                    <Image
                                        source={item.image}
                                        style={styles.categoryImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                            <Text
                                style={[
                                    styles.categoryLabel,
                                    { color: isSelected ? '#FF6B35' : tc.textSecondary },
                                ]}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    categoryWrapper: {
        alignItems: 'center',
        gap: 6,
        width: 80,
    },
    categoryRing: {
        padding: 3,
        borderRadius: 99,
        borderWidth: 2.5,
        borderColor: 'transparent',
    },
    categoryRingSelected: {
        borderColor: '#FF6B35',
    },
    categoryCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }
            : {
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            }),
    },
    categoryImage: {
        width: '100%' as any,
        height: '100%' as any,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
});
