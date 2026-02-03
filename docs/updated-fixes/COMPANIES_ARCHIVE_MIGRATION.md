# Companies Archive Migration Guide

## Step 1: Run SQL Migration

**Copy and run this in Supabase SQL Editor:**

```sql
-- Add is_archived and archived_at columns to companies table for soft delete
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_is_archived ON public.companies(is_archived);

-- Comment on columns
COMMENT ON COLUMN public.companies.is_archived IS 'Soft delete flag - archived companies are hidden but data is preserved';
COMMENT ON COLUMN public.companies.archived_at IS 'Timestamp when company was archived';
```

## Step 2: Verify Changes

After running the migration, verify in Supabase:
1. Go to Table Editor → companies
2. Check that `is_archived` and `archived_at` columns exist
3. All existing rows should have `is_archived = false`

## Step 3: Test Archive Feature

1. Refresh the Companies page in your frontend
2. Click Archive button on a company
3. Company should disappear from the list (archived)
4. `current_students` should now match `active_internships` count

## What's Fixed

✅ **Archive endpoint** - Now properly sets `is_archived = true` and `archived_at`
✅ **Student count sync** - `current_students` auto-updates from active internships
✅ **Statistics alignment** - Current Students and Active Internships now show same number
✅ **Archived companies hidden** - Default query excludes archived companies

## Backend Changes Made

1. `archiveCompany()` - Sets `is_archived = true, archived_at = now()`
2. `getCompanies()` - Filters out archived companies by default
3. `getCompanies()` - Auto-syncs `current_students` with real internship count
4. All queries now use `.in('status', ['active', 'ongoing'])` for accurate counts
