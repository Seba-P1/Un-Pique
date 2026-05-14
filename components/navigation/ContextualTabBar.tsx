import React, { useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NAV_CONTEXTS, NavContext, NavItem } from '../../constants/navConfig';

interface Props {
  context: NavContext;
  activeTab: string;
  onNavigate: (route: string) => void;
  onCreatePost: () => void;
}

export default function ContextualTabBar({ context, activeTab, onNavigate, onCreatePost }: Props) {
  const { width } = useWindowDimensions();
  const tc = useThemeColors() as any;
  const insets = useSafeAreaInsets();

  const items = NAV_CONTEXTS[context];
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  // Animación de transición al cambiar contexto
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withTiming(0, { duration: 80, easing: Easing.out(Easing.quad) }, () => {
      opacity.value = withTiming(1, { duration: 80, easing: Easing.in(Easing.quad) });
    });
  }, [context]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // En desktop no renderizar — la sidebar maneja la navegación
  // IMPORTANTE: este return va DESPUÉS de todos los hooks para cumplir las reglas de React
  if (width >= 768) return null;

  const isItemActive = (item: NavItem): boolean => {
    if (item.isSpecial) return false;
    if (item.key === 'index') return activeTab === 'index' || activeTab === undefined;
    return activeTab === item.key;
  };

  const handlePress = (item: NavItem) => {
    Haptics.selectionAsync();
    if (item.route === '__create_post__') {
      onCreatePost();
    } else {
      onNavigate(item.route);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: tc.tabBarBg ?? tc.bg,
          borderTopColor: tc.tabBarBorder ?? tc.borderLight,
        },
      ]}
    >
      <Animated.View style={[styles.itemsRow, animatedStyle]}>
        {items.map((item) => {
          const active = isItemActive(item);
          const IconComponent = item.Icon;

          if (item.isSpecial) {
            // ─── Botón "+" central ───────────────────────────────
            return (
              <Pressable
                key={item.key}
                onPress={() => handlePress(item)}
                style={({ pressed }) => [
                  styles.itemContainer,
                  styles.specialOuter,
                ]}
              >
                {({ pressed }) => (
                  <Animated.View
                    style={[
                      styles.specialBtn,
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                  >
                    <IconComponent size={24} color="#FFFFFF" strokeWidth={2} />
                  </Animated.View>
                )}
              </Pressable>
            );
          }

          // ─── Ítem normal ─────────────────────────────────────
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.itemContainer,
                pressed && { opacity: 0.6 },
              ]}
            >
              <IconComponent
                size={22}
                color={active ? '#FF6B35' : tc.icon ?? tc.textSecondary}
                strokeWidth={active ? 2.4 : 1.6}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? '#FF6B35' : tc.textMuted },
                  active && styles.labelActive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.label}
              </Text>
              {active && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // Sombra sutil hacia arriba
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0px -1px 16px rgba(0,0,0,0.07)' } as any,
    }),
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingTop: 4,
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    position: 'relative',
    maxWidth: '90%',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  labelActive: {
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6B35',
  },
  // Botón "+" especial
  specialOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  specialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0px 4px 16px rgba(255,107,53,0.4)' } as any,
    }),
  },
});
