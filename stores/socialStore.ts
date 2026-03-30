import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface Post {
    id: string;
    content: string;
    media_urls: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    author_id: string;
    locality_id: string;
    author: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
}

interface SocialState {
    posts: Post[];
    loading: boolean;
    fetchPosts: (localityId: string) => Promise<void>;
    fetchUserPosts: (userId: string) => Promise<Post[]>;
    fetchSavedPosts: (postIds: string[]) => Promise<Post[]>;
    createPost: (content: string, mediaUrls: string[], localityId: string, options?: { isRepost?: boolean }) => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    unlikePost: (postId: string) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    isLiked: (postId: string) => boolean;
    likedPosts: Set<string>;
    savedPosts: string[];
    isSaved: (postId: string) => boolean;
    toggleSave: (postId: string) => void;
}

export const useSocialStore = create<SocialState>()(
    persist(
        (set, get) => ({
            posts: [],
            loading: false,
            likedPosts: new Set(),
            savedPosts: [],

            fetchUserPosts: async (userId: string) => {
                const { data, error } = await supabase
                    .from('posts')
                    .select(`
                        id, content, media_urls, likes_count, comments_count, created_at, author_id, locality_id,
                        users:author_id (id, full_name, avatar_url)
                    `)
                    .eq('author_id', userId)
                    .order('created_at', { ascending: false });
                if (error) return [];
                return data.map((post: any) => ({
                    id: post.id, content: post.content, media_urls: post.media_urls || [],
                    likes_count: post.likes_count, comments_count: post.comments_count,
                    created_at: post.created_at, author_id: post.author_id, locality_id: post.locality_id,
                    author: { id: post.users?.id, full_name: post.users?.full_name || 'Usuario', avatar_url: post.users?.avatar_url || 'https://via.placeholder.com/150' }
                }));
            },

            fetchSavedPosts: async (postIds: string[]) => {
                if (postIds.length === 0) return [];
                const { data, error } = await supabase
                    .from('posts')
                    .select(`
                        id, content, media_urls, likes_count, comments_count, created_at, author_id, locality_id,
                        users:author_id (id, full_name, avatar_url)
                    `)
                    .in('id', postIds)
                    .order('created_at', { ascending: false });
                if (error) return [];
                return data.map((post: any) => ({
                    id: post.id, content: post.content, media_urls: post.media_urls || [],
                    likes_count: post.likes_count, comments_count: post.comments_count,
                    created_at: post.created_at, author_id: post.author_id, locality_id: post.locality_id,
                    author: { id: post.users?.id, full_name: post.users?.full_name || 'Usuario', avatar_url: post.users?.avatar_url || 'https://via.placeholder.com/150' }
                }));
            },

    fetchPosts: async (localityId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    content,
                    media_urls,
                    likes_count,
                    comments_count,
                    created_at,
                    author_id,
                    locality_id,
                    users:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('locality_id', localityId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedPosts = data.map((post: any) => ({
                id: post.id,
                content: post.content,
                media_urls: post.media_urls || [],
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                created_at: post.created_at,
                author_id: post.author_id,
                locality_id: post.locality_id,
                author: {
                    id: post.users?.id,
                    full_name: post.users?.full_name || 'Usuario',
                    avatar_url: post.users?.avatar_url || 'https://via.placeholder.com/150'
                }
            }));

            // Fetch user's likes
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: likes } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', formattedPosts.map(p => p.id));

                set({ likedPosts: new Set(likes?.map(l => l.post_id) || []) });
            }

            set({ posts: formattedPosts });
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            set({ loading: false });
        }
    },

    createPost: async (content, mediaUrls, localityId, options = {}) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const insertData: any = {
                content,
                media_urls: mediaUrls,
                author_id: user.id,
                locality_id: localityId,
            };
            
            // Si en el futuro integramos "is_repost" en la tabla, lo haríamos acá. 
            // Por ahora asumo que content ya refleja el Repost en texto para ser compatible.

            const { error } = await supabase
                .from('posts')
                .insert(insertData);

            if (error) throw error;

            // Refresh posts
            get().fetchPosts(localityId);
        } catch (error: any) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    likePost: async (postId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: user.id });

            if (error) throw error;

            // Optimistically update UI
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
                ),
                likedPosts: new Set([...state.likedPosts, postId]),
            }));
        } catch (error: any) {
            console.error('Error liking post:', error);
        }
    },

    unlikePost: async (postId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Optimistically update UI
            set((state) => {
                const newLikedPosts = new Set(state.likedPosts);
                newLikedPosts.delete(postId);
                return {
                    posts: state.posts.map((p) =>
                        p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
                    ),
                    likedPosts: newLikedPosts,
                };
            });
        } catch (error: any) {
            console.error('Error unliking post:', error);
        }
    },

    toggleLike: async (postId) => {
        const { isLiked, likePost, unlikePost } = get();
        if (isLiked(postId)) {
            await unlikePost(postId);
        } else {
            await likePost(postId);
        }
    },

    isLiked: (postId) => {
        return get().likedPosts.has(postId);
    },

    isSaved: (postId) => {
        return get().savedPosts.includes(postId);
    },

    toggleSave: (postId) => {
        set((state) => {
            const nextSaved = [...state.savedPosts];
            if (nextSaved.includes(postId)) {
                return { savedPosts: nextSaved.filter(id => id !== postId) };
            } else {
                return { savedPosts: [...nextSaved, postId] };
            }
        });
    },
        }),
        {
            name: 'social-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ savedPosts: state.savedPosts }),
        }
    )
);
