import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

interface AccommodationLocationMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function AccommodationLocationMap({
  latitude,
  longitude,
  title,
}: AccommodationLocationMapProps) {
  return (
    <View style={styles.clip}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          pinColor="#FF6B35"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
