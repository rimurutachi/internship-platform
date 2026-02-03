-- Phase 7: Automated Archive Notification Types
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    -- Add 'account_archive_warning' for 7-day warning before archive
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'account_archive_warning' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'account_archive_warning';
        RAISE NOTICE 'Added notification_type: account_archive_warning';
    ELSE
        RAISE NOTICE 'notification_type account_archive_warning already exists';
    END IF;

    -- Add 'account_archived' for when account gets archived
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'account_archived' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'account_archived';
        RAISE NOTICE 'Added notification_type: account_archived';
    ELSE
        RAISE NOTICE 'notification_type account_archived already exists';
    END IF;
END $$;
