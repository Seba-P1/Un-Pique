// Card Component - Un Pique Design System
import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import colors from '../../constants/colors';
import { AnimatedPressable } from './AnimatedPressable';
import { Platform } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: ViewStyle;
}

export function Card({
    children,
    onPress,
    variant = 'default',
    padding = 'md',
    style,
}: CardProps) {
    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return 8;
            case 'lg': return 24;
            default: return 16;
        }
    };

    const getStyles = (): ViewStyle => {
        const base: ViewStyle = {
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: getPadding(),
        };

        switch (variant) {
            case 'elevated':
                return {
                    ...base,
                    ...(Platform.OS === 'web' ? { boxShadow: '0px 10px 40px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 }),
                };
            case 'outlined':
                return {
                    ...base,
                    borderWidth: 1,
                    borderColor: colors.gray[200],
                };
            default:
                return {
                    ...base,
                    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }),
                };
        }
    };

    if (onPress) {
        return (
            <AnimatedPressable
                onPress={onPress}
                style={[getStyles(), style]}
            >
                {children}
            </AnimatedPressable>
        );
    }

    return (
        <View style={[getStyles(), style]}>
            {children}
        </View>
    );
}

export default Card;
