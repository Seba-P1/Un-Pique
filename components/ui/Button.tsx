// Button Component - Un Pique Design System
import React from 'react';
import {
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    Platform,
} from 'react-native';
import colors from '../../constants/colors';
import { AnimatedPressable } from './AnimatedPressable';
import haptics from '../../utils/haptics';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disableHaptics?: boolean; // Option to disable haptics for this button
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    style,
    textStyle,
    disableHaptics = false,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const handlePress = () => {
        if (!isDisabled) {
            if (!disableHaptics) {
                // Heavier haptic for primary actions, medium for others
                if (variant === 'primary' || variant === 'danger') {
                    haptics.medium();
                } else {
                    haptics.light();
                }
            }
            onPress();
        }
    };

    const getBackgroundColor = () => {
        if (isDisabled) return colors.gray[300];
        switch (variant) {
            case 'primary': return colors.primary.DEFAULT;
            case 'secondary': return colors.secondary.DEFAULT;
            case 'danger': return colors.danger;
            case 'whatsapp': return colors.whatsapp;
            case 'outline':
            case 'ghost': return 'transparent';
            default: return colors.primary.DEFAULT;
        }
    };

    const getTextColor = () => {
        if (isDisabled) return colors.gray[500];
        switch (variant) {
            case 'outline': return colors.primary.DEFAULT;
            case 'ghost': return colors.gray[700];
            default: return colors.white;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return colors.primary.DEFAULT;
        return 'transparent';
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: 8, paddingHorizontal: 16 };
            case 'lg': return { paddingVertical: 16, paddingHorizontal: 32 };
            default: return { paddingVertical: 12, paddingHorizontal: 24 };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return 14;
            case 'lg': return 18;
            default: return 16;
        }
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            disabled={isDisabled}
            style={[
                styles.button,
                getPadding(),
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 2 : 0,
                    width: fullWidth ? '100%' : 'auto',
                    opacity: isDisabled ? 0.7 : 1,
                    ...(variant === 'primary' && !isDisabled && Platform.OS === 'web' ? { boxShadow: '0 4px 14px rgba(255,107,53,0.3)' } : {}),
                    ...(variant === 'primary' && !isDisabled && Platform.OS !== 'web' ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } : {}),
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontSize: getFontSize(),
                                marginLeft: icon ? 8 : 0,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999, // Pill shape requested by User
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease',
            }
        })
    },
    text: {
        fontFamily: 'Nunito Sans',
        fontWeight: '700', // Slightly bolder for premium look on smaller buttons
        letterSpacing: 0.3,
    },
});

export default Button;
