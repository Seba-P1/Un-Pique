-- =====================================================
-- UN PIQUE v6.0 - SAFE INCREMENTAL SCHEMA
-- =====================================================
-- Run this script section by section in Supabase SQL Editor
-- It will only create what doesn't exist

-- =====================================================
-- PART 1: CORE TABLES
-- =====================================================

-- 1. USER FAVORITES
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

DROP INDEX IF EXISTS idx_user_favorites_user CASCADE;
DROP INDEX IF EXISTS idx_user_favorites_business CASCADE;
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_business ON user_favorites(business_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 2. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_notifications_user CASCADE;
DROP INDEX IF EXISTS idx_notifications_read CASCADE;
DROP INDEX IF EXISTS idx_notifications_created CASCADE;
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. CHAT ROOMS
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE chat_rooms ADD CONSTRAINT chat_rooms_participants_unique UNIQUE(participant_1, participant_2);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DROP INDEX IF EXISTS idx_chat_rooms_p1 CASCADE;
DROP INDEX IF EXISTS idx_chat_rooms_p2 CASCADE;
CREATE INDEX idx_chat_rooms_p1 ON chat_rooms(participant_1);
CREATE INDEX idx_chat_rooms_p2 ON chat_rooms(participant_2);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- 4. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_chat_messages_room CASCADE;
DROP INDEX IF EXISTS idx_chat_messages_sender CASCADE;
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. POST LIKES
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE post_likes ADD CONSTRAINT post_likes_post_user_unique UNIQUE(post_id, user_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DROP INDEX IF EXISTS idx_post_likes_post CASCADE;
DROP INDEX IF EXISTS idx_post_likes_user CASCADE;
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 6. POST COMMENTS
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_post_comments_post CASCADE;
DROP INDEX IF EXISTS idx_post_comments_user CASCADE;
CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at DESC);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 7. SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_service_requests_user CASCADE;
DROP INDEX IF EXISTS idx_service_requests_professional CASCADE;
DROP INDEX IF EXISTS idx_service_requests_status CASCADE;
CREATE INDEX idx_service_requests_user ON service_requests(user_id);
CREATE INDEX idx_service_requests_professional ON service_requests(professional_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- 8. PROFESSIONAL REVIEWS
CREATE TABLE IF NOT EXISTS professional_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE professional_reviews ADD CONSTRAINT professional_reviews_user_request_unique UNIQUE(user_id, service_request_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DROP INDEX IF EXISTS idx_professional_reviews_professional CASCADE;
DROP INDEX IF EXISTS idx_professional_reviews_rating CASCADE;
CREATE INDEX idx_professional_reviews_professional ON professional_reviews(professional_id);
CREATE INDEX idx_professional_reviews_rating ON professional_reviews(professional_id, rating);

ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;

-- 9. UPDATE POSTS TABLE
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- =====================================================
-- PART 2: RLS POLICIES (Safe to run multiple times)
-- =====================================================

-- Drop all policies first to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can remove their favorites" ON user_favorites;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their comments" ON post_comments;

DROP POLICY IF EXISTS "Users can view their own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create requests" ON service_requests;
DROP POLICY IF EXISTS "Professionals can update requests" ON service_requests;

DROP POLICY IF EXISTS "Anyone can view reviews" ON professional_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON professional_reviews;

-- Create policies
CREATE POLICY "Users can view their own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their chat rooms" ON chat_rooms FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can view messages in their rooms" ON chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = room_id
        AND (chat_rooms.participant_1 = auth.uid() OR chat_rooms.participant_2 = auth.uid())
    )
);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests" ON service_requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() = professional_id);
CREATE POLICY "Users can create requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Professionals can update requests" ON service_requests FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Anyone can view reviews" ON professional_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON professional_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 3: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes ON post_likes;
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments ON post_comments;
CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update chat room timestamp
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms SET last_message_at = NOW() WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_chat_timestamp
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_room_timestamp();

-- =====================================================
-- DONE! Schema is ready
-- =====================================================
