import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

interface BusinessMapProps {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
}

export default function BusinessMap({ latitude, longitude, name, address }: BusinessMapProps) {
    return (
        <MapView
            style={styles.map}
            initialRegion={{
                latitude: latitude || -34.6037,
                longitude: longitude || -58.3816,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
        >
            <Marker
                coordinate={{
                    latitude: latitude || -34.6037,
                    longitude: longitude || -58.3816,
                }}
                title={name}
                description={address}
            />
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});
