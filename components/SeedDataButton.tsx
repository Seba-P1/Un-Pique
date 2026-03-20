import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';

export const SeedDataButton = () => {
    const { user } = useAuthStore();
    const { currentLocality } = useLocationStore();
    const [loading, setLoading] = useState(false);

    const seedData = async () => {
        if (!user || !currentLocality) {
            Alert.alert('Error', 'Debes iniciar sesión y seleccionar localidad');
            return;
        }

        setLoading(true);
        try {
            // 1. Insert Stories
            const { error: storyError } = await supabase.from('stories').insert([
                {
                    locality_id: currentLocality.id,
                    author_id: user.id,
                    media_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
                    media_type: 'image',
                    caption: '¡Nuestras nuevas hamburguesas!',
                    expires_at: new Date(Date.now() + 86400000).toISOString() // 24hs from now
                },
                {
                    locality_id: currentLocality.id,
                    author_id: user.id,
                    media_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
                    media_type: 'image',
                    caption: 'Promo 2x1 solo por hoy',
                    expires_at: new Date(Date.now() + 86400000).toISOString()
                }
            ]);

            if (storyError) throw storyError;

            // 2. Insert Posts
            const { error: postError } = await supabase.from('posts').insert([
                {
                    locality_id: currentLocality.id,
                    author_id: user.id,
                    title: 'Gran Apertura',
                    content: '¡Bienvenidos a nuestra nueva sucursal en el centro!',
                    media_urls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800'],
                    post_type: 'news'
                }
            ]);

            if (postError) throw postError;

            // 3. Insert Business (if not exists for user)
            const { count } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user.id);

            if (count === 0) {
                const { error: businessError } = await supabase.from('businesses').insert([
                    {
                        locality_id: currentLocality.id,
                        owner_id: user.id,
                        name: 'Burger House Test',
                        slug: 'burger-house-test-' + Date.now(),
                        category: 'restaurant',
                        description: 'Las mejores hamburguesas de la ciudad, ahora en la app.',
                        address: 'San Martin 1234',
                        rating: 4.8,
                        delivery_radius_km: 5,
                        cover_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800',
                        is_open: true,
                        business_hours: {
                            monday: { open: '19:00', close: '23:00', is_closed: false }
                        }
                    }
                ]);
                if (businessError) throw businessError;

                // 4. Insert Products for the new Business
                // Need to get the new business ID properly
                const { data: newBusiness } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (newBusiness) {
                    await supabase.from('products').insert([
                        {
                            business_id: newBusiness.id,
                            name: 'Hamburguesa Doble',
                            description: 'Doble carne, cheddar, bacon y huevo.',
                            price: 6200,
                            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
                            is_available: true,
                            category_id: 'Destacados' // Using simple string for category mostly likely
                        },
                        {
                            business_id: newBusiness.id,
                            name: 'Papas Cheddar',
                            description: 'Porción grande con cheddar y verdeo.',
                            price: 3500,
                            image_url: 'https://images.unsplash.com/photo-1573080496987-a2267dc57b7f?q=80&w=800',
                            is_available: true,
                            category_id: 'Acompañamientos'
                        }
                    ]);
                }
            }

            if (postError) throw postError;

            Alert.alert('Éxito', 'Datos de prueba insertados (Historias, Posts, Negocio y Productos).');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ marginVertical: 20 }}>
            {loading ? (
                <ActivityIndicator />
            ) : (
                <Button title="[DEV] Sembrar Datos de Prueba" onPress={seedData} color="#FF6B35" />
            )}
        </View>
    );
};
