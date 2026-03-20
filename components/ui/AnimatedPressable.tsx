import React, { useRef } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Animated } from 'react-native';

interface AnimatedPressableProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    scaleVal?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    children,
    style,
    scaleVal = 0.95,
    ...props
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: scaleVal,
            useNativeDriver: true,
            friction: 8,
            tension: 300,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 300,
        }).start();
    };

    return (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                {...props}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};
