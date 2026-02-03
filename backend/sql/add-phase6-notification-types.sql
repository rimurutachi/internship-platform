-- Add Phase 6 Document Requirements notification types
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    -- Add 'document_required' for when advisor posts a new requirement
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_required' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_required';
        RAISE NOTICE 'Added notification_type: document_required';
    ELSE
        RAISE NOTICE 'notification_type document_required already exists';
    END IF;

    -- Add 'document_submitted' for when student submits a document
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_submitted' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_submitted';
        RAISE NOTICE 'Added notification_type: document_submitted';
    ELSE
        RAISE NOTICE 'notification_type document_submitted already exists';
    END IF;

    -- Add 'document_reviewed' for when advisor reviews a submission
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_reviewed' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_reviewed';
        RAISE NOTICE 'Added notification_type: document_reviewed';
    ELSE
        RAISE NOTICE 'notification_type document_reviewed already exists';
    END IF;

    -- Add 'document_revision_requested' for when advisor requests revisions
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_revision_requested' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_revision_requested';
        RAISE NOTICE 'Added notification_type: document_revision_requested';
    ELSE
        RAISE NOTICE 'notification_type document_revision_requested already exists';
    END IF;

    -- Add 'document_approved' for when advisor approves a submission
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_approved' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_approved';
        RAISE NOTICE 'Added notification_type: document_approved';
    ELSE
        RAISE NOTICE 'notification_type document_approved already exists';
    END IF;
END $$;
