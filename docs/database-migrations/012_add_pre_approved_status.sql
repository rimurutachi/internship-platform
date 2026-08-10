-- Migration 012: Add 'pre_approved' to document_status enum
-- Purpose: Support content-locking for the hybrid document workflow.
-- When an advisor pre-approves a draft, the document transitions from 'draft' to 'pre_approved',
-- which locks the content from further collaborative editing while allowing read-only viewing.

-- Step 1: Add the 'pre_approved' value to the existing document_status enum type
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'pre_approved';

-- Note: PostgreSQL enum value additions are transactional in PG 12+
-- This value is added between existing values; ordering can be specified with BEFORE/AFTER if needed.
-- The 'pre_approved' status sits logically between 'draft' and 'in_review' in the workflow lifecycle:
--   draft → pre_approved → in_review → approved → completed
