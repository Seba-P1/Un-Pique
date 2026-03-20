import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useStoriesStore } from '../../stores/storiesStore';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { StoryViewer, CreateStoryModal } from '../../components/stories';
import { useThemeColors } from '../../hooks/useThemeColors';

export function StoriesRail() {
    const tc = useThemeColors();
    const { stories, loading, fetchStories } = useStoriesStore();
    const { currentLocality } = useLocationStore();
    const { user } = useAuthStore();

    const [viewerVisible, setViewerVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [activeStories, setActiveStories] = useState<any[]>([]);

    useEffect(() => {
        if (currentLocality) {
            fetchStories(currentLocality.id);
        }
    }, [currentLocality]);

    const handleStoryPress = (index: number, userStories: any[]) => {
        setActiveStories(userStories);
        setViewerVisible(true);
    };

    const handleCreateStory = () => {
        if (!user) {
            Alert.alert('Iniciá sesión', 'Tenés que estar logueado para subir historias, che.');
            return;
        }
        setCreateModalVisible(true);
    };

    const otherStories = stories.filter(s => s.user.id !== user?.id);
    const myStory = stories.find(s => s.user.id === user?.id);

    return (
        <View style={[styles.container, { backgroundColor: tc.bg, borderBottomColor: tc.borderLight }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Create / My Story */}
                <TouchableOpacity style={styles.storyItem} onPress={handleCreateStory}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100' }}
                            style={styles.avatar}
                        />
                        <View style={[styles.plusBadge, { borderColor: tc.bg }]}>
                            <Plus size={12} color={colors.white as any} />
                        </View>
                        {myStory && (
                            <LinearGradient
                                colors={[colors.primary.DEFAULT, colors.warning]}
                                style={[styles.gradientBorder, { position: 'absolute', zIndex: -1 }]}
                            />
                        )}
                    </View>
                    <Text style={[styles.username, { color: tc.textSecondary }]}>Tu historia</Text>
                </TouchableOpacity>

                {/* Other Stories */}
                {otherStories.map((storyGroup, index) => (
                    <TouchableOpacity
                        key={storyGroup.id}
                        style={styles.storyItem}
                        onPress={() => handleStoryPress(0, storyGroup.stories)}
                    >
                        <View style={styles.gradientBorderContainer}>
                            <LinearGradient
                                colors={[colors.primary.DEFAULT, colors.warning]}
                                style={styles.gradientBorder}
                            />
                            <View style={[styles.avatarContainerInner, { backgroundColor: tc.bg }]}>
                                <Image
                                    source={{ uri: storyGroup.user.avatar_url }}
                                    style={styles.avatar}
                                />
                            </View>
                        </View>
                        <Text style={[styles.username, { color: tc.textSecondary }]} numberOfLines={1}>
                            {storyGroup.user.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <CreateStoryModal
                visible={createModalVisible}
                onClose={() => {
                    setCreateModalVisible(false);
                    if (currentLocality) fetchStories(currentLocality.id);
                }}
            />

            <StoryViewer
                visible={viewerVisible}
                stories={activeStories}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    storyItem: {
        alignItems: 'center',
        width: 72,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    gradientBorderContainer: {
        width: 68,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 4,
    },
    gradientBorder: {
        width: 68,
        height: 68,
        borderRadius: 34,
        position: 'absolute',
    },
    avatarContainerInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    plusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary.DEFAULT,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    username: {
        fontSize: 11,
        textAlign: 'center',
    },
});
