import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Story {
    id: string;
    media_url: string;
    url: string; // Backward compatibility
    media_type: 'image' | 'video';
    duration: number;
    created_at: string;
    author_id: string;
    locality_id: string;
    expires_at: string;
    audio_url: string | null;
    has_audio: boolean;
    audio_duration?: number | null;
    is_sponsored?: boolean;
    author?: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
    user?: { // Backward compatibility
        id: string;
        name: string;
        avatar_url: string;
    };
}

interface StoriesState {
    stories: Story[];
    loading: boolean;
    viewedStoryIds: Set<string>;
    fetchStories: (localityId: string, options?: { isSponsored?: boolean }) => Promise<void>;
    fetchUserStories: (userId: string) => Promise<void>;
    createStory: (
        mediaUri: string, 
        mediaType: 'image' | 'video', 
        localityId: string, 
        audioUrl?: string | null, 
        hasAudio?: boolean,
        audioDuration?: number | null
    ) => Promise<Story>;
    markAsViewed: (storyId: string) => void;
}

const mapStoryWithCompatibility = (story: any): Story => ({
    ...story,
    url: story.media_url,
    user: story.author ? {
        id: story.author.id,
        name: story.author.full_name,
        avatar_url: story.author.avatar_url || 'https://via.placeholder.com/100',
    } : undefined
});

export const useStoriesStore = create<StoriesState>((set, get) => ({
    stories: [],
    loading: false,
    viewedStoryIds: new Set<string>(),

    markAsViewed: (storyId) => {
        set(state => ({
            viewedStoryIds: new Set([...state.viewedStoryIds, storyId])
        }));
    },

    createStory: async (mediaUri, mediaType, localityId, audioUrl = null, hasAudio = false, audioDuration = null) => {
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

            const { data: insertedStories, error: insertError } = await supabase
                .from('stories')
                .insert({
                    author_id: user.id,
                    media_url: publicUrl,
                    media_type: mediaType,
                    duration: mediaType === 'image' ? 5 : 15,
                    locality_id: localityId,
                    expires_at: expiresAt.toISOString(),
                    audio_url: audioUrl,
                    has_audio: hasAudio,
                    audio_duration: audioDuration ?? null,
                })
                .select();

            if (insertError) throw insertError;
            if (!insertedStories || insertedStories.length === 0) throw new Error('Failed to insert story');

            const insertedStory = insertedStories[0];

            // Fetch with author relation
            const { data: selectData, error: selectError } = await supabase
                .from('stories')
                .select(`
                    *,
                    author:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('id', insertedStory.id)
                .single();

            if (selectError) throw selectError;

            const newStory = mapStoryWithCompatibility(selectData);

            // Update state
            set(state => ({ stories: [newStory, ...state.stories] }));

            return newStory;
        } catch (error) {
            console.error('Error creating story:', error);
            throw error;
        }
    },

    fetchStories: async (localityId, options) => {
        set({ loading: true });
        try {
            let query = supabase
                .from('stories')
                .select(`
                    *,
                    author:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('locality_id', localityId)
                .gt('expires_at', new Date().toISOString());

            if (options?.isSponsored) {
                query = query.eq('is_sponsored', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            const storiesWithCompatibility = (data || []).map(mapStoryWithCompatibility);
            set({ stories: storiesWithCompatibility });
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            set({ loading: false });
        }
    },

    fetchUserStories: async (userId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    author:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('author_id', userId)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            const storiesWithCompatibility = (data || []).map(mapStoryWithCompatibility);
            set({ stories: storiesWithCompatibility });
        } catch (error) {
            console.error('Error fetching user stories:', error);
        } finally {
            set({ loading: false });
        }
    },
}));
