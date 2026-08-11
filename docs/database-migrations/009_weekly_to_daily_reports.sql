-- Migration: Transform weekly reports into daily reports
-- This migration creates the new student_daily_reports table
-- and drops the old student_weekly_accomplishments table.
--
-- The student_daily_reports table is student-exclusive:
-- - Only students can create/view/edit their own reports
-- - Advisors and admins can only see aggregated progress (total hours, completion %)
-- - No supervisor approval flow

-- 1. Create the new daily reports table
CREATE TABLE IF NOT EXISTS public.student_daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  report_date date NOT NULL,
  activities text NOT NULL,
  learnings text,
  hours_worked numeric NOT NULL DEFAULT 0 CHECK (hours_worked >= 0 AND hours_worked <= 24),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  deleted_at timestamp with time zone,
  CONSTRAINT student_daily_reports_pkey PRIMARY KEY (id),
  CONSTRAINT student_daily_reports_internship_id_fkey FOREIGN KEY (internship_id) REFERENCES public.internships(id),
  CONSTRAINT student_daily_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id),
  CONSTRAINT student_daily_reports_unique_date UNIQUE (internship_id, student_id, report_date)
);

-- 2. Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_reports_student ON public.student_daily_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_internship ON public.student_daily_reports(internship_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.student_daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_student_internship ON public.student_daily_reports(student_id, internship_id);

-- 3. RLS Policies - Students can only manage their own daily reports
ALTER TABLE public.student_daily_reports ENABLE ROW LEVEL SECURITY;

-- Students can view their own reports
CREATE POLICY "Students can view own daily reports"
  ON public.student_daily_reports
  FOR SELECT
  TO public
  USING (student_id = auth.uid());

-- Students can insert their own reports
CREATE POLICY "Students can insert own daily reports"
  ON public.student_daily_reports
  FOR INSERT
  TO public
  WITH CHECK (student_id = auth.uid());

-- Students can update their own reports
CREATE POLICY "Students can update own daily reports"
  ON public.student_daily_reports
  FOR UPDATE
  TO public
  USING (student_id = auth.uid());

-- Students can delete their own reports
CREATE POLICY "Students can delete own daily reports"
  ON public.student_daily_reports
  FOR DELETE
  TO public
  USING (student_id = auth.uid());

-- Service role (backend) can manage all reports for hours calculations
CREATE POLICY "Service role manages all daily reports"
  ON public.student_daily_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Drop the old weekly accomplishments table (after data migration if needed)
-- WARNING: Only run this after confirming the new table works correctly
-- DROP TABLE IF EXISTS public.student_weekly_accomplishments;

-- 5. Update notification type enum if needed
-- Remove weekly_report_submitted, weekly_report_approved, weekly_report_rejected
-- (These are no longer needed since daily reports have no approval flow)
