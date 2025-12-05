-- ============================================================
-- EVALUATIONS AI ANALYSIS TABLE SCHEMA (ALREADY EXISTS IN DATABASE)
-- ============================================================
-- This file documents the existing schema for reference.
-- The table was created using the migration in the Supabase SQL Editor.
-- DO NOT RUN THIS AGAIN - it will fail due to existing constraints.
-- ============================================================

-- For reference, here is the existing schema:

CREATE TABLE IF NOT EXISTS public.evaluations_ai_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL UNIQUE,
  
  -- LLT Feature Extraction
  extracted_technical_skills text[] DEFAULT ARRAY[]::text[],
  extracted_soft_skills text[] DEFAULT ARRAY[]::text[],
  key_achievements text[] DEFAULT ARRAY[]::text[],
  areas_for_improvement text[] DEFAULT ARRAY[]::text[],
  
  -- Sentiment Analysis (three separate scores that sum to ~1.0)
  sentiment_positive_score real,
  sentiment_neutral_score real,
  sentiment_negative_score real,
  overall_sentiment text CHECK (overall_sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])),
  
  -- Recommendations & Insights
  ai_recommendations text[] DEFAULT ARRAY[]::text[],
  suggested_improvements text[] DEFAULT ARRAY[]::text[],
  potential_biases text[] DEFAULT ARRAY[]::text[],
  
  -- Processing metadata
  ai_model_version text,
  processing_time_ms integer CHECK (processing_time_ms >= 0),
  overall_confidence_score real CHECK (overall_confidence_score >= 0 AND overall_confidence_score <= 1),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT evaluations_ai_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_ai_analysis_evaluation_id_fkey 
    FOREIGN KEY (evaluation_id) REFERENCES public.evaluations(id) ON DELETE CASCADE,
  CONSTRAINT sentiment_scores_valid CHECK (
    sentiment_positive_score >= 0 AND sentiment_positive_score <= 1 AND
    sentiment_neutral_score >= 0 AND sentiment_neutral_score <= 1 AND
    sentiment_negative_score >= 0 AND sentiment_negative_score <= 1 AND
    (sentiment_positive_score + sentiment_neutral_score + sentiment_negative_score) <= 1.01
  )
);

-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_ai_analysis_evaluation_id 
    ON public.evaluations_ai_analysis(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_ai_analysis_created_at 
    ON public.evaluations_ai_analysis(created_at);

-- ============================================================
-- EVALUATIONS TABLE - RELEVANT COLUMNS
-- ============================================================

-- These columns exist in the evaluations table:
-- - ai_analysis_id uuid (FK to evaluations_ai_analysis.id)
-- - bias_check_passed boolean
-- - confidence_score real
-- - student_id uuid (FK to users.id)
-- - advisor_id uuid (FK to users.id)
-- - advisor_reviewed_at timestamp with time zone
-- - advisor_comments text

-- ============================================================
-- EXISTING VIEW: evaluation_details
-- ============================================================

-- This view combines evaluations with AI analysis and user data
-- It's already created in the database and includes:
-- - All evaluation fields
-- - All AI analysis fields (with prefixes)
-- - Student, supervisor, and advisor user details

-- ============================================================
-- COLUMN MAPPING FOR AI SERVICE INTEGRATION
-- ============================================================

-- AI Service Response → Database Schema Mapping:
-- 
-- features.technical_skills → extracted_technical_skills
-- features.soft_skills → extracted_soft_skills
-- sentiment.breakdown.positive → sentiment_positive_score
-- sentiment.breakdown.neutral → sentiment_neutral_score
-- sentiment.breakdown.negative → sentiment_negative_score
-- sentiment.label → overall_sentiment
-- bias_check.flags → potential_biases
-- confidence_score → overall_confidence_score
-- processing_time_ms → processing_time_ms

-- Fields to populate later (optional):
-- - key_achievements: Can be extracted from feedback_text
-- - areas_for_improvement: Can be extracted from feedback_text
-- - ai_recommendations: Generated based on analysis
-- - suggested_improvements: Generated based on analysis
-- - ai_model_version: Set to 'v1.0.0' or current version

COMMENT ON TABLE public.evaluations_ai_analysis IS 
    'Stores AI-generated analysis results for internship evaluations including LLT feature extraction, sentiment analysis, and bias detection. Created via Supabase SQL Editor migration.';

COMMENT ON COLUMN public.evaluations_ai_analysis.extracted_technical_skills IS 
    'Array of technical skills extracted from evaluation text using LLT (e.g., [''React'', ''Node.js'', ''Python''])';

COMMENT ON COLUMN public.evaluations_ai_analysis.extracted_soft_skills IS 
    'Array of soft skills extracted from evaluation text (e.g., [''communication'', ''teamwork'', ''problem-solving''])';

COMMENT ON COLUMN public.evaluations_ai_analysis.sentiment_positive_score IS 
    'Positive sentiment score (0.0 to 1.0). Sum of all sentiment scores should be ~1.0';

COMMENT ON COLUMN public.evaluations_ai_analysis.sentiment_neutral_score IS 
    'Neutral sentiment score (0.0 to 1.0). Sum of all sentiment scores should be ~1.0';

COMMENT ON COLUMN public.evaluations_ai_analysis.sentiment_negative_score IS 
    'Negative sentiment score (0.0 to 1.0). Sum of all sentiment scores should be ~1.0';

COMMENT ON COLUMN public.evaluations_ai_analysis.overall_sentiment IS 
    'Overall sentiment classification: positive, neutral, or negative';

COMMENT ON COLUMN public.evaluations_ai_analysis.potential_biases IS 
    'Array of detected bias indicators from AI analysis (e.g., [''gender_bias'', ''age_bias''])';

COMMENT ON COLUMN public.evaluations_ai_analysis.overall_confidence_score IS 
    'AI confidence level in the analysis ranging from 0.0 to 1.0';

COMMENT ON COLUMN public.evaluations_ai_analysis.processing_time_ms IS 
    'Time taken for AI processing in milliseconds';

