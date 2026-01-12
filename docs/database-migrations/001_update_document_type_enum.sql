-- Migration: Update document_type enum to include file-based types
-- Date: 2026-01-11
-- Purpose: Add new file extension types (pdf, docx, xlsx, image, zip) to document_type enum
--          This allows documents to be categorized by file type instead of just document category

-- Step 1: Add new values to the document_type enum
-- Note: PostgreSQL doesn't support removing enum values, so we ADD new ones only
-- If you need to remove old values, you'd need to recreate the enum

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'pdf';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'docx';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'xlsx';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'image';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'zip';

-- Verify the enum values
-- Run this to see all document_type enum values:
-- SELECT unnest(enum_range(NULL::document_type)) as document_types;

-- Expected result after migration:
-- document_types
-- ---------------
-- evaluation
-- agreement
-- report
-- form
-- certificate
-- memorandum
-- other
-- pdf
-- docx
-- xlsx
-- image
-- zip
