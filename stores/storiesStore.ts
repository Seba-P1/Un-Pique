import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

interface UserStoryGroup {
    id: string;
    user: {
        id: string;
        name: string;
        avatar_url: string;
    };
    hasStory: boolean;
    stories: Story[];
}

interface StoriesState {
    stories: UserStoryGroup[];
    loading: boolean;
    fetchStories: (localityId: string) => Promise<void>;
    createStory: (mediaUri: string, mediaType: 'image' | 'video', localityId: string) => Promise<void>;
}

export const useStoriesStore = create<StoriesState>((set, get) => ({
    stories: [],
    loading: false,

    createStory: async (mediaUri, mediaType, localityId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Upload media to Supabase Storage using unified service
            const { uploadImage } = require('../services/imageUpload');
            let publicUrl = '';
            
            if (mediaType === 'image') {
                const result = await uploadImage(mediaUri, 'stories', '', { maxWidth: 1080, maxHeight: 1920, quality: 0.8 });
                publicUrl = result.url;
            } else {
                // Para videos seguimos usando la subida nativa
                const response = await fetch(mediaUri);
                const blob = await response.blob();
                const fileExt = mediaUri.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `stories/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('stories')
                    .upload(filePath, blob);
    
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage
                    .from('stories')
                    .getPublicUrl(filePath);
                publicUrl = urlData.publicUrl;
            }

            // Create story record
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const { error: insertError } = await supabase
                .from('stories')
                .insert({
                    author_id: user.id,
                    media_url: publicUrl,
                    media_type: mediaType,
                    duration: mediaType === 'image' ? 5 : 15,
                    locality_id: localityId,
                    expires_at: expiresAt.toISOString(),
                });

            if (insertError) throw insertError;

            // Refresh stories
            await get().fetchStories(localityId);
        } catch (error) {
            console.error('Error creating story:', error);
            throw error;
        }
    },

    fetchStories: async (localityId) => {
        set({ loading: true });
        try {
            // 1. Fetch active stories (not expired) for the locality
            const { data, error } = await supabase
                .from('stories')
                .select(`
          id,
          media_url,
          media_type,
          duration,
          created_at,
          author_id,
          users:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
                .eq('locality_id', localityId)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // 2. Group stories by user
            const groupedStories: { [key: string]: UserStoryGroup } = {};

            data.forEach((story: any) => {
                const userId = story.author_id;
                if (!groupedStories[userId]) {
                    // Safe check for user data
                    const user = story.users || {
                        id: userId,
                        full_name: 'Usuario Desconocido',
                        avatar_url: 'https://via.placeholder.com/100'
                    };

                    groupedStories[userId] = {
                        id: userId,
                        user: {
                            id: userId,
                            name: user.full_name,
                            avatar_url: user.avatar_url || 'https://via.placeholder.com/100', // Fallback avatar
                        },
                        hasStory: true,
                        stories: [],
                    };
                }

                groupedStories[userId].stories.push({
                    id: story.id,
                    url: story.media_url,
                    media_type: story.media_type,
                    duration: story.duration,
                    created_at: story.created_at,
                    user: groupedStories[userId].user,
                });
            });

            set({ stories: Object.values(groupedStories) });
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            set({ loading: false });
        }
    },
}));
