-- Add archive columns to internships table
-- Run this migration to enable soft delete (archive) functionality for internships

ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_internships_is_archived 
ON public.internships(is_archived);

-- Add comment
COMMENT ON COLUMN public.internships.is_archived IS 
  'Soft delete flag - archived internships are hidden but data is preserved';
COMMENT ON COLUMN public.internships.archived_at IS 
  'Timestamp when the internship was archived';
