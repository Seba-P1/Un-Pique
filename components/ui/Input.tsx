// Input Component - Un Pique Design System
import React, { useState } from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import colors from '../../constants/colors';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helper?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export function Input({
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerStyle,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
        if (error) return colors.danger;
        if (isFocused) return colors.primary.DEFAULT;
        return colors.gray[300];
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    {
                        borderColor: getBorderColor(),
                        backgroundColor: props.editable === false ? colors.gray[100] : colors.white,
                    },
                ]}
            >
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        {
                            paddingLeft: leftIcon ? 8 : 16,
                            paddingRight: rightIcon ? 8 : 16,
                        },
                    ]}
                    placeholderTextColor={colors.gray[400]}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />

                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {helper && !error && <Text style={styles.helper}>{helper}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.gray[700],
        marginBottom: 8,
        fontFamily: 'Nunito Sans',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        minHeight: 48,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.gray[900],
        paddingVertical: 12,
        fontFamily: 'Nunito Sans',
    },
    iconLeft: {
        paddingLeft: 12,
    },
    iconRight: {
        paddingRight: 12,
    },
    error: {
        fontSize: 12,
        color: colors.danger,
        marginTop: 4,
        fontFamily: 'Nunito Sans',
    },
    helper: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 4,
        fontFamily: 'Nunito Sans',
    },
});

export default Input;
