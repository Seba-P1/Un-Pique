import React, { useState, useEffect, useRef } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { X, Music } from 'lucide-react-native';
import { Audio } from 'expo-av';
import colors from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useStoriesStore } from '../../stores/storiesStore';

const { width, height } = Dimensions.get('window');

interface Story {
    id: string;
    url: string;
    media_url?: string;
    media_type: 'image' | 'video';
    duration: number;
    created_at: string;
    audio_url?: string | null;
    has_audio?: boolean;
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
    const [imageReady, setImageReady] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const { markAsViewed } = useStoriesStore();

    // Synchronize current index when the modal opens
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    // Reset imageReady when changing story
    useEffect(() => {
        setImageReady(false);
    }, [currentIndex]);

    // Mark story as viewed
    useEffect(() => {
        if (visible && stories.length > 0 && currentIndex < stories.length) {
            const story = stories[currentIndex];
            if (story?.id) {
                markAsViewed(story.id);
            }
        }
    }, [visible, currentIndex, stories]);

    // Prefetch next story image
    useEffect(() => {
        if (visible && stories.length > 0) {
            const nextStory = stories[currentIndex + 1];
            const nextUrl = nextStory?.url || nextStory?.media_url;
            if (nextUrl) {
                Image.prefetch(nextUrl).catch(() => {});
            }
        }
    }, [visible, currentIndex, stories]);

    // Handle background audio playback and cleanup
    useEffect(() => {
        let isCancelled = false;
        let soundInstance: Audio.Sound | null = null;

        const playAudio = async () => {
            if (visible && stories.length > 0 && currentIndex < stories.length) {
                const currentStory = stories[currentIndex];
                if (currentStory?.audio_url) {
                    try {
                        // Stop and unload any previous sound
                        if (soundRef.current) {
                            const prevSound = soundRef.current;
                            soundRef.current = null;
                            await prevSound.stopAsync();
                            await prevSound.unloadAsync();
                        }

                        if (isCancelled) return;

                        console.log('[StoryViewer] Loading background audio:', currentStory.audio_url);
                        const { sound } = await Audio.Sound.createAsync(
                            { uri: currentStory.audio_url },
                            { shouldPlay: true, isLooping: false }
                        );

                        if (isCancelled) {
                            await sound.unloadAsync();
                            return;
                        }

                        soundInstance = sound;
                        soundRef.current = sound;
                    } catch (error) {
                        console.error('[StoryViewer] Error playing audio:', error);
                    }
                } else {
                    // No audio on current story, clean up active sound
                    if (soundRef.current) {
                        const prevSound = soundRef.current;
                        soundRef.current = null;
                        await prevSound.stopAsync();
                        await prevSound.unloadAsync();
                    }
                }
            } else {
                // Not visible or invalid state, clean up active sound
                if (soundRef.current) {
                    const prevSound = soundRef.current;
                    soundRef.current = null;
                    await prevSound.stopAsync();
                    await prevSound.unloadAsync();
                }
            }
        };

        playAudio();

        return () => {
            isCancelled = true;
            if (soundInstance) {
                soundInstance.stopAsync()
                    .then(() => soundInstance?.unloadAsync())
                    .catch(err => console.log('[StoryViewer] Sound cleanup error:', err));
            }
            if (soundRef.current) {
                const prevSound = soundRef.current;
                soundRef.current = null;
                prevSound.stopAsync()
                    .then(() => prevSound.unloadAsync())
                    .catch(err => console.log('[StoryViewer] Ref cleanup error:', err));
            }
        };
    }, [visible, currentIndex, stories]);

    // Handle progress bar animation — wait for image to be ready
    useEffect(() => {
        if (!imageReady) return;
        if (visible && stories.length > 0) {
            startProgress();
        }
        return () => {
            progress.setValue(0);
        };
    }, [visible, currentIndex, imageReady]);

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

    const storyImageUrl = currentStory.url || currentStory.media_url;

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
                    source={{ uri: storyImageUrl }}
                    style={styles.storyImage}
                    resizeMode="cover"
                    onLoad={() => setImageReady(true)}
                    onError={() => setImageReady(true)}
                />

                {/* Loading indicator while image loads */}
                {!imageReady && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator color="#FF6B35" size="large" />
                    </View>
                )}

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

                {/* Background Music Badge */}
                {currentStory.has_audio && (
                    <View style={styles.musicBadge} pointerEvents="none">
                        <Music size={14} color={colors.white} />
                        <Text style={styles.musicText} numberOfLines={1}>Con música</Text>
                    </View>
                )}

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
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        zIndex: 5,
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
    musicBadge: {
        position: 'absolute',
        bottom: 50,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        zIndex: 5,
    },
    musicText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '500',
    },
});
