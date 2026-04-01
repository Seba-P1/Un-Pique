import React from 'react';
import { Platform, Switch, View, StyleSheet, ViewStyle } from 'react-native';

interface AppToggleProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    style?: ViewStyle | any;
}

export function AppToggle({ value, onValueChange, style }: AppToggleProps) {
    if (Platform.OS === 'web') {
        return (
            <View style={style}>
                <div
                    onClick={() => onValueChange(!value)}
                    style={{
                        width: '51px',
                        height: '31px',
                        borderRadius: '16px',
                        backgroundColor: value ? '#cc5500' : '#1a1a1a',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        margin: 0,
                    }}
                >
                    <div
                        style={{
                            width: '27px',
                            height: '27px',
                            borderRadius: '50%',
                            backgroundColor: '#FF6B35',
                            transform: `translateX(${value ? 22 : 2}px)`,
                            transition: 'transform 0.2s ease',
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
                        }}
                    />
                </div>
            </View>
        );
    }

    return (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#1a1a1a', true: '#cc5500' }}
            thumbColor="#FF6B35"
            style={style}
        />
    );
}

const styles = StyleSheet.create({});
