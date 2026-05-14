// AddressMapPreview — Web version with embedded OSM iframe
import React, { useRef } from 'react';
import {
  StyleSheet, View, Text, Animated, Pressable, Platform,
} from 'react-native';
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
}: AddressMapPreviewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      stiffness: 300,
      damping: 20,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 300,
      damping: 20,
      useNativeDriver: false,
    }).start();
  };

  // Build OSM embed URL with bounding box around the point
  const delta = 0.004;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          } as any,
        ]}
      >
        {/* OSM iframe */}
        <View style={styles.iframeWrapper}>
          <iframe
            src={iframeSrc}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              borderRadius: 15,
              pointerEvents: 'none',
            } as any}
            loading="lazy"
            title={`Mapa - ${title}`}
          />
        </View>

        {/* Touchable overlay to capture press */}
        <View style={styles.touchOverlay} />

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
  iframeWrapper: {
    width: '100%',
    height: '100%',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
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
