-- Add progress column to internships table
-- Progress is calculated as percentage of approved weeks vs total internship weeks
-- Formula: (approved_weeks / total_weeks) * 100
-- Uses: student_weekly_accomplishments table (status = 'approved')

ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Add comment
COMMENT ON COLUMN public.internships.progress IS 'Internship progress percentage (0-100) based on approved weekly accomplishments';

-- Create function to calculate progress automatically
CREATE OR REPLACE FUNCTION calculate_internship_progress(internship_id uuid)
RETURNS integer AS $$
DECLARE
  total_weeks integer;
  submitted_weeks integer;
  progress_pct integer;
  internship_start date;
  internship_end date;
BEGIN
  -- Get internship dates
  SELECT start_date, end_date 
  INTO internship_start, internship_end
  FROM internships 
  WHERE id = internship_id;
  
  -- Calculate total weeks: (end_date - start_date) gives integer days, divide by 7
  total_weeks := GREATEST(1, CEIL((internship_end - internship_start)::numeric / 7.0)::integer);
  
  -- Count weeks with approved accomplishments
  SELECT COUNT(DISTINCT week_number)
  INTO submitted_weeks
  FROM student_weekly_accomplishments swa
  WHERE swa.internship_id = calculate_internship_progress.internship_id
    AND swa.status = 'approved';
  
  -- Calculate percentage
  IF total_weeks > 0 THEN
    progress_pct := LEAST(100, ROUND((submitted_weeks::numeric / total_weeks::numeric) * 100)::integer);
  ELSE
    progress_pct := 0;
  END IF;
  
  RETURN progress_pct;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update progress when weekly accomplishments change
CREATE OR REPLACE FUNCTION update_internship_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for the affected internship
  UPDATE internships
  SET progress = calculate_internship_progress(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.internship_id
      ELSE NEW.internship_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.internship_id
    ELSE NEW.internship_id
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS weekly_accomplishment_progress_update ON student_weekly_accomplishments;

-- Create trigger on student_weekly_accomplishments table
CREATE TRIGGER weekly_accomplishment_progress_update
  AFTER INSERT OR UPDATE OR DELETE ON student_weekly_accomplishments
  FOR EACH ROW
  EXECUTE FUNCTION update_internship_progress_trigger();

-- Initial calculation for existing internships
UPDATE internships
SET progress = calculate_internship_progress(id)
WHERE status IN ('active', 'completed');

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_internships_progress ON internships(progress);
CREATE INDEX IF NOT EXISTS idx_weekly_accomplishments_internship_week ON student_weekly_accomplishments(internship_id, week_number);

-- Show results
SELECT 
  i.id,
  u.first_name || ' ' || u.last_name as student_name,
  c.name as company,
  i.start_date,
  i.end_date,
  i.progress as progress_pct,
  COUNT(DISTINCT swa.week_number) as weeks_submitted,
  CEIL((i.end_date - i.start_date)::numeric / 7.0)::integer as total_weeks
FROM internships i
LEFT JOIN users u ON i.student_id = u.id
LEFT JOIN companies c ON i.company_id = c.id
LEFT JOIN student_weekly_accomplishments swa ON swa.internship_id = i.id AND swa.status = 'approved'
WHERE i.status IN ('active', 'completed')
GROUP BY i.id, u.first_name, u.last_name, c.name, i.start_date, i.end_date, i.progress
ORDER BY i.created_at DESC;
