-- Migration 011: Weekly DTR (Daily Time Record) Submissions
-- 
-- Purpose: New table to store weekly DTR file submissions from students.
-- DTR submissions replace daily reports as the basis for total_hours_worked.
-- Flow: Student submits DTR file → Advisor reviews (approve/revise) → 
--        AI scans for hours extraction → Hours reflected in internship progress.
--
-- Run this in the Supabase SQL Editor as a single query.

-- =============================================================================
-- 1. Create the weekly_dtr_submissions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.weekly_dtr_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  requirement_id uuid,                                        -- optional link to document_requirements
  week_number integer NOT NULL,                                -- week 1, 2, 3, etc. of the internship
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  file_url text NOT NULL,                                      -- Supabase storage path
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  status text DEFAULT 'pending'::text 
    CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'revision_requested'::text])),
  reviewed_by uuid,                                            -- advisor who reviewed
  reviewed_at timestamp with time zone,
  feedback text,                                               -- advisor feedback/comments
  extracted_hours numeric DEFAULT 0,                           -- hours extracted by AI after approval
  ai_scan_status text DEFAULT 'pending'::text 
    CHECK (ai_scan_status = ANY (ARRAY['pending'::text, 'scanning'::text, 'completed'::text, 'failed'::text, 'manual'::text])),
  ai_scan_result jsonb DEFAULT '{}'::jsonb,                    -- full AI scan output (daily breakdown, confidence, etc.)
  manual_hours_override numeric,                               -- advisor can override AI-extracted hours
  version integer DEFAULT 1,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_dtr_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_dtr_submissions_internship_id_fkey FOREIGN KEY (internship_id) REFERENCES public.internships(id),
  CONSTRAINT weekly_dtr_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id),
  CONSTRAINT weekly_dtr_submissions_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.document_requirements(id),
  CONSTRAINT weekly_dtr_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
  CONSTRAINT unique_dtr_per_week_version UNIQUE (internship_id, week_number, version)
);

-- =============================================================================
-- 2. Create indexes for common query patterns
-- =============================================================================

-- Student fetching their own DTR submissions
CREATE INDEX IF NOT EXISTS idx_dtr_student 
  ON public.weekly_dtr_submissions(student_id);

-- Fetching DTRs by internship (for progress calculations)
CREATE INDEX IF NOT EXISTS idx_dtr_internship 
  ON public.weekly_dtr_submissions(internship_id);

-- Filtering by status (advisor reviewing pending submissions)
CREATE INDEX IF NOT EXISTS idx_dtr_status 
  ON public.weekly_dtr_submissions(status);

-- Combined: internship + status (approved DTRs for hours calculation)
CREATE INDEX IF NOT EXISTS idx_dtr_internship_status 
  ON public.weekly_dtr_submissions(internship_id, status);

-- Combined: student + internship (student viewing their DTRs for a specific internship)
CREATE INDEX IF NOT EXISTS idx_dtr_student_internship 
  ON public.weekly_dtr_submissions(student_id, internship_id);

-- Week ordering
CREATE INDEX IF NOT EXISTS idx_dtr_week_number 
  ON public.weekly_dtr_submissions(week_number DESC);

-- Advisor review queue (pending submissions sorted by date)
CREATE INDEX IF NOT EXISTS idx_dtr_pending_review 
  ON public.weekly_dtr_submissions(status, submitted_at DESC) 
  WHERE status = 'pending';

-- =============================================================================
-- 3. Enable Row Level Security
-- =============================================================================

ALTER TABLE public.weekly_dtr_submissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS Policies — Students
-- =============================================================================

-- Students can view their own DTR submissions
CREATE POLICY "Students can view own DTR submissions"
  ON public.weekly_dtr_submissions
  FOR SELECT
  TO public
  USING (student_id = auth.uid());

-- Students can insert their own DTR submissions
CREATE POLICY "Students can insert own DTR submissions"
  ON public.weekly_dtr_submissions
  FOR INSERT
  TO public
  WITH CHECK (student_id = auth.uid());

-- Students can update their own DTR submissions (for resubmission)
CREATE POLICY "Students can update own DTR submissions"
  ON public.weekly_dtr_submissions
  FOR UPDATE
  TO public
  USING (student_id = auth.uid());

-- Students can delete their own DTR submissions (only pending ones, enforced at app level)
CREATE POLICY "Students can delete own DTR submissions"
  ON public.weekly_dtr_submissions
  FOR DELETE
  TO public
  USING (student_id = auth.uid());

-- =============================================================================
-- 5. RLS Policies — Advisors
-- =============================================================================

-- Advisors can view DTR submissions for internships they advise
CREATE POLICY "Advisors can view DTR submissions for their internships"
  ON public.weekly_dtr_submissions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.internships i
      WHERE i.id = weekly_dtr_submissions.internship_id
        AND i.advisor_id = auth.uid()
    )
  );

-- Advisors can update DTR submissions for review (approve/request revision)
CREATE POLICY "Advisors can review DTR submissions"
  ON public.weekly_dtr_submissions
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.internships i
      WHERE i.id = weekly_dtr_submissions.internship_id
        AND i.advisor_id = auth.uid()
    )
  );

-- =============================================================================
-- 6. RLS Policies — Admins
-- =============================================================================

-- Admins can view all DTR submissions
CREATE POLICY "Admins can view all DTR submissions"
  ON public.weekly_dtr_submissions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

-- Admins can manage all DTR submissions
CREATE POLICY "Admins can manage all DTR submissions"
  ON public.weekly_dtr_submissions
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

-- =============================================================================
-- 7. RLS Policies — Service Role (Backend / AI Service)
-- =============================================================================

-- Service role can manage all DTR submissions (for AI scanning, hours updates)
CREATE POLICY "Service role manages all DTR submissions"
  ON public.weekly_dtr_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 8. Add comment on table for documentation
-- =============================================================================

COMMENT ON TABLE public.weekly_dtr_submissions IS 
  'Weekly DTR (Daily Time Record) submissions from students. Replaces daily reports as the basis for total_hours_worked. Flow: Student submits → Advisor reviews → AI scans hours → Hours reflected in internship progress.';

COMMENT ON COLUMN public.weekly_dtr_submissions.extracted_hours IS 
  'Total hours extracted by AI scanning after advisor approval. This is what gets added to internships.total_hours_worked.';

COMMENT ON COLUMN public.weekly_dtr_submissions.ai_scan_result IS 
  'Full AI scan output including daily breakdown, time-in/time-out, confidence score, and notes.';

COMMENT ON COLUMN public.weekly_dtr_submissions.manual_hours_override IS 
  'If set, this value overrides the AI-extracted hours. Used when advisor wants to manually correct the hours.';

COMMENT ON COLUMN public.weekly_dtr_submissions.version IS 
  'Version number for resubmissions. Increments when student resubmits after revision request.';
