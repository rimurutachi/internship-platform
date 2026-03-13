-- Add missing notification types to notification_type enum
-- Run this in Supabase SQL Editor

-- Step 1: Add new notification type 'message_received' to the enum
-- Note: In PostgreSQL, you cannot modify an enum directly with ALTER TYPE ADD VALUE if it's in use.
-- We need to use ALTER TYPE ... ADD VALUE which is safe and doesn't require dropping columns.

DO $$ 
BEGIN
    -- Add 'message_received' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'message_received' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'message_received';
        RAISE NOTICE 'Added notification_type: message_received';
    ELSE
        RAISE NOTICE 'notification_type message_received already exists';
    END IF;

    -- Add other notification types that might be missing
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'weekly_report_submitted' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'weekly_report_submitted';
        RAISE NOTICE 'Added notification_type: weekly_report_submitted';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'weekly_report_approved' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'weekly_report_approved';
        RAISE NOTICE 'Added notification_type: weekly_report_approved';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'weekly_report_rejected' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'weekly_report_rejected';
        RAISE NOTICE 'Added notification_type: weekly_report_rejected';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'evaluation_submitted' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'evaluation_submitted';
        RAISE NOTICE 'Added notification_type: evaluation_submitted';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'evaluation_approved' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'evaluation_approved';
        RAISE NOTICE 'Added notification_type: evaluation_approved';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'internship_active' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'internship_active';
        RAISE NOTICE 'Added notification_type: internship_active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'internship_completed' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'internship_completed';
        RAISE NOTICE 'Added notification_type: internship_completed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'internship_cancelled' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'internship_cancelled';
        RAISE NOTICE 'Added notification_type: internship_cancelled';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'internship_reminder' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'internship_reminder';
        RAISE NOTICE 'Added notification_type: internship_reminder';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'system' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'system';
        RAISE NOTICE 'Added notification_type: system';
    END IF;
END $$;

-- Verify all notification types
SELECT enumlabel AS notification_type
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
ORDER BY enumlabel;
