import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

interface BusinessMapProps {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
}

export default function BusinessMap({ latitude, longitude, name, address }: BusinessMapProps) {
    return (
        <View style={styles.mapPlaceholder}>
            <Text style={styles.text}>Mapa interactivo disponible en la App Móvil</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    mapPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.gray[100],
    },
    text: {
        fontFamily: 'Nunito Sans',
        color: colors.gray[500],
        marginBottom: 4,
        textAlign: 'center',
        padding: 20,
    },
});
