import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    Animated,
    StatusBar,
} from 'react-native';
import { X } from 'lucide-react-native';
import colors from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Story {
    id: string;
    url: string;
    media_type: 'image' | 'video';
    duration: number;
    created_at: string;
    user?: {
        id: string;
        name: string;
        avatar_url: string;
    };
}

interface StoryViewerProps {
    visible: boolean;
    stories: Story[];
    initialIndex?: number;
    onClose: () => void;
}

export function StoryViewer({ visible, stories, initialIndex = 0, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible && stories.length > 0) {
            startProgress();
        }
        return () => {
            progress.setValue(0);
        };
    }, [visible, currentIndex]);

    const startProgress = () => {
        progress.setValue(0);
        const duration = (stories[currentIndex]?.duration || 5) * 1000;

        Animated.timing(progress, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                handleNext();
            }
        });
    };

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const currentStory = stories[currentIndex];

    if (!currentStory) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                {/* Story Image */}
                <Image
                    source={{ uri: currentStory.url }}
                    style={styles.storyImage}
                    resizeMode="cover"
                />

                {/* Gradient Overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.gradient}
                />

                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                    {stories.map((_, index) => (
                        <View key={index} style={styles.progressBarBackground}>
                            <Animated.View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width:
                                            index === currentIndex
                                                ? progress.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                                : index < currentIndex
                                                    ? '100%'
                                                    : '0%',
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image
                            source={{ uri: currentStory.user?.avatar_url }}
                            style={styles.avatar}
                        />
                        <Text style={styles.userName}>{currentStory.user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={28} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Touch Areas */}
                <View style={styles.touchAreas}>
                    <TouchableOpacity
                        style={styles.touchLeft}
                        onPress={handlePrevious}
                        activeOpacity={1}
                    />
                    <TouchableOpacity
                        style={styles.touchRight}
                        onPress={handleNext}
                        activeOpacity={1}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    storyImage: {
        width,
        height,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.3,
    },
    progressContainer: {
        position: 'absolute',
        top: 50,
        left: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
        zIndex: 10,
    },
    progressBarBackground: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.white,
        borderRadius: 2,
    },
    header: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.white,
    },
    userName: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    touchAreas: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },
    touchLeft: {
        flex: 1,
    },
    touchRight: {
        flex: 1,
    },
});
