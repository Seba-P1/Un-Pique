import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity, Dimensions, Animated, StatusBar, Platform } from 'react-native';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface Story {
    id: string;
    url: string;
    duration: number; // in seconds
    type: 'image' | 'video';
    user: {
        id: string;
        name: string;
        avatar_url: string;
    };
    created_at: string;
}

interface StoryViewerProps {
    visible: boolean;
    stories: Story[];
    initialStoryIndex?: number;
    onClose: () => void;
}

export const StoryViewer = ({ visible, stories, initialStoryIndex = 0, onClose }: StoryViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const progress = useRef(new Animated.Value(0)).current;

    // Reset cuando se abre o cambia la historia
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialStoryIndex);
            startProgress();
        } else {
            progress.setValue(0);
        }
    }, [visible, initialStoryIndex]);

    useEffect(() => {
        if (visible) {
            progress.setValue(0);
            startProgress();
        }
    }, [currentIndex, visible]);

    const startProgress = () => {
        Animated.timing(progress, {
            toValue: 1,
            duration: 5000, // 5 segundos por historia por defecto
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
        } else {
            // Reiniciar la historia actual si es la primera
            progress.setValue(0);
            startProgress();
        }
    };

    const currentStory = stories[currentIndex];

    if (!currentStory) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="black" />

                {/* Background Image */}
                <Image
                    source={{ uri: currentStory.url }}
                    style={styles.media}
                    resizeMode="cover"
                />

                {/* Overlay Gradient */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.overlay}
                    locations={[0, 0.2, 1]}
                />

                <SafeAreaView style={styles.safeArea}>
                    {/* Progress Bars */}
                    <View style={styles.progressContainer}>
                        {stories.map((story, index) => (
                            <View key={story.id} style={styles.progressBarBg}>
                                {index === currentIndex ? (
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: progress.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                ) : (
                                    <View style={[
                                        styles.progressBarFill,
                                        { width: index < currentIndex ? '100%' : '0%' }
                                    ]} />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.userInfo}>
                            <Image source={{ uri: currentStory.user.avatar_url }} style={styles.avatar} />
                            <Text style={styles.userName}>{currentStory.user.name}</Text>
                            <Text style={styles.timeText}>• 2h</Text>
                        </View>

                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Touch Areas for Navigation */}
                    <View style={styles.touchContainer}>
                        <TouchableOpacity style={styles.leftTouch} onPress={handlePrevious} activeOpacity={1} />
                        <TouchableOpacity style={styles.rightTouch} onPress={handleNext} activeOpacity={1} />
                    </View>

                    {/* Footer / Reply */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.replyInput} activeOpacity={0.9}>
                            <Text style={styles.replyPlaceholder}>Enviar mensaje...</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Heart size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Send size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    media: {
        width: width,
        height: height,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        gap: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'white',
        marginRight: 10,
    },
    userName: {
        color: 'white',
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '700',
    },
    timeText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        marginLeft: 8,
    },
    closeButton: {
        padding: 4,
    },
    touchContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    leftTouch: {
        flex: 0.3,
    },
    rightTouch: {
        flex: 0.7,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'android' ? 16 : 8,
        marginBottom: 10,
    },
    replyInput: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginRight: 16,
    },
    replyPlaceholder: {
        color: 'white',
        fontFamily: 'Nunito Sans',
        fontSize: 15,
    },
    actionButton: {
        padding: 8,
    },
});
