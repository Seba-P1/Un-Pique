// AddressMapPreview — Mapa miniatura nativo con react-native-maps
import React, { useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Platform, Animated, Pressable,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Maximize2 } from 'lucide-react-native';

interface AddressMapPreviewProps {
  latitude: number;
  longitude: number;
  title: string;
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  textColor?: string;
  textMuted?: string;
}

export default function AddressMapPreview({
  latitude,
  longitude,
  title,
  onPress,
  backgroundColor,
  borderColor,
  textColor = '#fff',
  textMuted = '#A0A0A0',
}: AddressMapPreviewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      stiffness: 300,
      damping: 20,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 300,
      damping: 20,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
          },
          Platform.OS !== 'web' ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          } : {
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          } as any,
        ]}
      >
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={title}
            pinColor="#FF6B35"
          />
        </MapView>

        {/* Expand badge */}
        <View style={styles.expandBadge}>
          <Maximize2 size={13} color="#fff" />
          <Text style={styles.expandText}>Ampliar</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  expandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expandText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
