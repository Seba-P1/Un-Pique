// Banner de publicidades — Más grande, responsivo, con autoplay
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView, Animated, Text } from 'react-native';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const BANNERS = [
    { id: '1', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80', title: 'Promo Pizza', subtitle: '¡50% OFF en tu primer pedido!' },
    { id: '2', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80', title: 'Oferta Sushi', subtitle: 'Combos desde $1200' },
    { id: '3', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80', title: 'Come Saludable', subtitle: 'Ensaladas y bowls frescos' },
    { id: '4', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80', title: 'Noche de Pizza', subtitle: 'Delivery gratis los viernes' },
];

export const AdBanner = () => {
    const tc = useThemeColors();
    const { width: screenWidth } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Responsivo: ocupa casi todo el ancho con padding
    const bannerWidth = Math.min(screenWidth - 32, 1000);
    const bannerHeight = screenWidth >= 768 ? 280 : 200;

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % BANNERS.length;
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
            scrollRef.current?.scrollTo({ x: nextIndex * bannerWidth, animated: true });
            setActiveIndex(nextIndex);
        }, 4000);
        return () => clearInterval(interval);
    }, [activeIndex, bannerWidth]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ width: bannerWidth }}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
                        setActiveIndex(idx);
                    }}
                >
                    {BANNERS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.9}
                            style={[styles.slide, { width: bannerWidth, height: bannerHeight, backgroundColor: tc.bgCard }]}
                        >
                            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                            {/* Overlay con texto */}
                            <View style={styles.overlay}>
                                <Text style={styles.bannerTitle}>{item.title}</Text>
                                <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
            {/* Dots indicadores */}
            <View style={styles.dots}>
                {BANNERS.map((_, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => {
                            scrollRef.current?.scrollTo({ x: i * bannerWidth, animated: true });
                            setActiveIndex(i);
                        }}
                    >
                        <View style={[
                            styles.dot,
                            { backgroundColor: tc.borderLight },
                            activeIndex === i && styles.activeDot
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 16,
    },
    slide: {
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
        
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 24,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        
        
        
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    dots: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        backgroundColor: colors.primary.DEFAULT,
        width: 24,
    },
});
