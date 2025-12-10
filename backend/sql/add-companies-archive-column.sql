-- Add is_archived and archived_at columns to companies table for soft delete
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_is_archived ON public.companies(is_archived);

-- Comment on columns
COMMENT ON COLUMN public.companies.is_archived IS 'Soft delete flag - archived companies are hidden but data is preserved';
COMMENT ON COLUMN public.companies.archived_at IS 'Timestamp when company was archived';
