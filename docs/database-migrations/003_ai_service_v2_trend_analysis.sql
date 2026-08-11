-- Migration: AI Service v2.0.0 - Trend Analysis
-- Date: 2026-01-12
-- Description: Updates for transitioning from individual evaluation AI analysis 
--              to historical trend analysis for decision support

-- =============================================================================
-- DEPRECATION NOTICE
-- =============================================================================
-- The following table is now deprecated:
-- - evaluations_ai_analysis: Was used to store individual evaluation AI analysis
--   New approach: AI analysis is done on-demand from approved evaluations
--   The table can remain for historical data but will not receive new records.

-- NOTE: No destructive changes - table is left intact for backward compatibility
-- Future cleanup can drop this table after confirming no frontend dependencies

-- =============================================================================
-- OPTIONAL: New Analytics Cache Table (if needed for performance)
-- =============================================================================
-- This table can be used to cache trend analysis results
-- Uncomment and run if you want to implement caching

/*
CREATE TABLE IF NOT EXISTS evaluation_analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL, -- 'trends', 'dashboard', 'companies', 'universities', 'skills'
  university_id UUID REFERENCES universities(id),
  company_id UUID REFERENCES companies(id),
  filters JSONB DEFAULT '{}'::jsonb,
  result JSONB NOT NULL,
  evaluation_count INT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX idx_analytics_cache_type_uni ON evaluation_analytics_cache(analysis_type, university_id);
CREATE INDEX idx_analytics_cache_expires ON evaluation_analytics_cache(expires_at);

-- Auto-delete expired cache entries
CREATE OR REPLACE FUNCTION cleanup_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM evaluation_analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the existing schema supports the new AI service

-- Check evaluations table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
AND column_name IN ('supervisor_comments', 'total_score', 'final_grade', 'attendance', 'punctuality', 'advisor_approved_at');

-- Check evaluation_criterion_scores exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluation_criterion_scores';

-- Check internships has company relationship
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'internships'
AND column_name IN ('company_id', 'student_id', 'position', 'department');

-- Count approved evaluations available for analysis
SELECT COUNT(*) as approved_evaluations_count 
FROM evaluations 
WHERE status = 'approved' 
AND supervisor_comments IS NOT NULL;

-- =============================================================================
-- CHANGES SUMMARY
-- =============================================================================
-- 1. evaluations_ai_analysis table: DEPRECATED (no new writes)
-- 2. No new tables required (analysis is done on-demand)
-- 3. Optional: evaluation_analytics_cache for caching results
-- 4. Backend changes handle all AI integration via aiService.ts and analyticsService.ts
