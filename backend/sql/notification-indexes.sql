-- Notification System Performance Indexes
-- Run this in Supabase SQL Editor to optimize notification queries

-- =====================================================
-- NOTIFICATION TABLE INDEXES
-- =====================================================

-- Index for fetching user's notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

-- Index for filtering by read status
CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON public.notifications(is_read);

-- Index for cleanup job (delete by created_at)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at);

-- Index for filtering by type (used in retention policy)
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON public.notifications(type);

-- Composite index for the most common query pattern:
-- "Get user's unread notifications, sorted by newest first"
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_recent 
ON public.notifications(user_id, is_read, created_at DESC);

-- Composite index for cleanup queries:
-- "Delete old notifications by type"
CREATE INDEX IF NOT EXISTS idx_notifications_type_created 
ON public.notifications(type, created_at);

-- =====================================================
-- INTERNSHIP REMINDERS TABLE INDEXES
-- =====================================================

-- Index for fetching reminders by internship
CREATE INDEX IF NOT EXISTS idx_internship_reminders_internship_id 
ON public.internship_reminders(internship_id);

-- Index for scheduled reminder processing (cron job)
CREATE INDEX IF NOT EXISTS idx_internship_reminders_scheduled_pending 
ON public.internship_reminders(is_sent, scheduled_for) 
WHERE is_sent = false;

-- =====================================================
-- VERIFY INDEXES CREATED
-- =====================================================
-- You can run this to verify the indexes exist:
-- 
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'notifications'
-- ORDER BY indexname;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. These indexes will improve query performance significantly
-- 2. They add minimal overhead on INSERT (notification creation)
-- 3. Run the notification cleanup job daily to maintain table size
-- 4. Monitor query performance using Supabase Dashboard -> Database -> Query Performance
