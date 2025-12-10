-- ============================================================================
-- EVALUATION TYPES: Weekly & Midterm Support
-- Add support for different evaluation types (weekly, midterm, final)
-- ============================================================================

-- Step 1: Add evaluation_type column
ALTER TABLE public.evaluations
ADD COLUMN evaluation_type VARCHAR(20) DEFAULT 'final' 
CHECK (evaluation_type IN ('weekly', 'midterm', 'final'));

-- Step 2: Add week_number for weekly evaluations (1-10 or more)
ALTER TABLE public.evaluations
ADD COLUMN week_number INTEGER CHECK (week_number >= 1 AND week_number <= 20);

-- Step 3: Add evaluation_period for display (e.g., "Week 1", "Midterm", "Final")
ALTER TABLE public.evaluations
ADD COLUMN evaluation_period VARCHAR(50);

-- Step 4: Add due_date for scheduled evaluations
ALTER TABLE public.evaluations
ADD COLUMN due_date DATE;

-- Step 5: Add is_mandatory flag (midterm and final are mandatory)
ALTER TABLE public.evaluations
ADD COLUMN is_mandatory BOOLEAN DEFAULT false;

-- Step 6: Create index for efficient querying by type and internship
CREATE INDEX idx_evaluations_type_internship ON public.evaluations(evaluation_type, internship_id);
CREATE INDEX idx_evaluations_week_number ON public.evaluations(week_number) WHERE week_number IS NOT NULL;
CREATE INDEX idx_evaluations_due_date ON public.evaluations(due_date) WHERE due_date IS NOT NULL;

-- Step 7: Add comment explaining the schema
COMMENT ON COLUMN public.evaluations.evaluation_type IS 'Type of evaluation: weekly (regular check-ins), midterm (comprehensive mid-internship review), final (complete end-of-internship evaluation)';
COMMENT ON COLUMN public.evaluations.week_number IS 'Week number for weekly evaluations (1-20). NULL for midterm and final evaluations.';
COMMENT ON COLUMN public.evaluations.evaluation_period IS 'Human-readable period label: "Week 1", "Week 2", "Midterm", "Final"';
COMMENT ON COLUMN public.evaluations.due_date IS 'Scheduled due date for the evaluation. Used for reminders and tracking.';
COMMENT ON COLUMN public.evaluations.is_mandatory IS 'Whether this evaluation is mandatory (true for midterm and final, optional for weekly)';

-- Step 8: Update existing evaluations to be 'final' type
UPDATE public.evaluations 
SET evaluation_type = 'final',
    evaluation_period = 'Final',
    is_mandatory = true
WHERE evaluation_type IS NULL OR evaluation_type = 'final';

-- Step 9: Create a helper function to generate evaluation_period
CREATE OR REPLACE FUNCTION generate_evaluation_period(
  p_type VARCHAR(20),
  p_week_number INTEGER
) RETURNS VARCHAR(50) AS $$
BEGIN
  CASE p_type
    WHEN 'weekly' THEN
      RETURN 'Week ' || p_week_number;
    WHEN 'midterm' THEN
      RETURN 'Midterm';
    WHEN 'final' THEN
      RETURN 'Final';
    ELSE
      RETURN 'Unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 10: Create trigger to auto-set evaluation_period
CREATE OR REPLACE FUNCTION set_evaluation_period()
RETURNS TRIGGER AS $$
BEGIN
  NEW.evaluation_period := generate_evaluation_period(NEW.evaluation_type, NEW.week_number);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_evaluation_period
  BEFORE INSERT OR UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION set_evaluation_period();

-- Step 11: Create view for evaluation timeline per internship
CREATE OR REPLACE VIEW evaluation_timeline AS
SELECT 
  e.id,
  e.internship_id,
  e.evaluation_type,
  e.week_number,
  e.evaluation_period,
  e.status,
  e.rating_overall,
  e.due_date,
  e.submitted_at,
  e.created_at,
  i.student_id,
  i.supervisor_id,
  i.start_date,
  i.end_date,
  -- Calculate if overdue
  CASE 
    WHEN e.status = 'draft' AND e.due_date < CURRENT_DATE THEN true
    ELSE false
  END as is_overdue,
  -- Calculate days until due
  CASE 
    WHEN e.status = 'draft' AND e.due_date IS NOT NULL THEN 
      e.due_date - CURRENT_DATE
    ELSE NULL
  END as days_until_due
FROM public.evaluations e
JOIN public.internships i ON e.internship_id = i.id
ORDER BY e.internship_id, 
  CASE e.evaluation_type
    WHEN 'weekly' THEN 1
    WHEN 'midterm' THEN 2
    WHEN 'final' THEN 3
  END,
  e.week_number NULLS LAST;

COMMENT ON VIEW evaluation_timeline IS 'Timeline view of all evaluations per internship with status and due date tracking';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_set_evaluation_period ON public.evaluations;
-- DROP FUNCTION IF EXISTS set_evaluation_period();
-- DROP FUNCTION IF EXISTS generate_evaluation_period(VARCHAR, INTEGER);
-- DROP VIEW IF EXISTS evaluation_timeline;
-- DROP INDEX IF EXISTS idx_evaluations_type_internship;
-- DROP INDEX IF EXISTS idx_evaluations_week_number;
-- DROP INDEX IF EXISTS idx_evaluations_due_date;
-- ALTER TABLE public.evaluations DROP COLUMN IF EXISTS evaluation_type;
-- ALTER TABLE public.evaluations DROP COLUMN IF EXISTS week_number;
-- ALTER TABLE public.evaluations DROP COLUMN IF EXISTS evaluation_period;
-- ALTER TABLE public.evaluations DROP COLUMN IF EXISTS due_date;
-- ALTER TABLE public.evaluations DROP COLUMN IF EXISTS is_mandatory;
