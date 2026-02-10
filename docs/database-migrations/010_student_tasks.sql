-- ============================================================================
-- Student Tasks Feature - Complete Migration
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- 1. Create the student_tasks table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  internship_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'pending'::text,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Primary key
  CONSTRAINT student_tasks_pkey PRIMARY KEY (id),
  
  -- Foreign keys
  CONSTRAINT student_tasks_student_id_fkey FOREIGN KEY (student_id) 
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT student_tasks_internship_id_fkey FOREIGN KEY (internship_id) 
    REFERENCES public.internships(id) ON DELETE CASCADE,
  
  -- Check constraints
  CONSTRAINT student_tasks_priority_check CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT student_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- 2. Add table comment
-- ============================================================================
COMMENT ON TABLE public.student_tasks IS 'Personal task management for students during their internship period';

-- 3. Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON public.student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_internship_id ON public.student_tasks(internship_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON public.student_tasks(status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON public.student_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_student_tasks_created_at ON public.student_tasks(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_status 
  ON public.student_tasks(student_id, status);

-- 4. Enable Row Level Security
-- ============================================================================
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (for idempotent reruns)
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own tasks" ON public.student_tasks;
DROP POLICY IF EXISTS "Students can create their own tasks" ON public.student_tasks;
DROP POLICY IF EXISTS "Students can update their own tasks" ON public.student_tasks;
DROP POLICY IF EXISTS "Students can delete their own tasks" ON public.student_tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.student_tasks;

-- 6. Create RLS Policies
-- ============================================================================

-- Policy: Students can view their own tasks
CREATE POLICY "Students can view their own tasks"
  ON public.student_tasks
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
  );

-- Policy: Students can create their own tasks
CREATE POLICY "Students can create their own tasks"
  ON public.student_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'student'
    )
  );

-- Policy: Students can update their own tasks
CREATE POLICY "Students can update their own tasks"
  ON public.student_tasks
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
  )
  WITH CHECK (
    student_id = auth.uid()
  );

-- Policy: Students can delete their own tasks
CREATE POLICY "Students can delete their own tasks"
  ON public.student_tasks
  FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
  );

-- Policy: Admins can view all tasks (for analytics/reports)
CREATE POLICY "Admins can view all tasks"
  ON public.student_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 7. Create updated_at trigger function (if not exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for auto-updating updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_student_tasks_updated_at ON public.student_tasks;

CREATE TRIGGER update_student_tasks_updated_at
  BEFORE UPDATE ON public.student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create trigger for auto-setting completed_at when status changes to completed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = now();
  END IF;
  
  -- Clear completed_at if status changes from 'completed' to something else
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_student_task_completion ON public.student_tasks;

CREATE TRIGGER handle_student_task_completion
  BEFORE UPDATE ON public.student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_completion();

-- 10. Grant permissions
-- ============================================================================
GRANT ALL ON public.student_tasks TO authenticated;
GRANT SELECT ON public.student_tasks TO anon;

-- ============================================================================
-- Verification queries (optional - uncomment to test)
-- ============================================================================
-- SELECT * FROM public.student_tasks LIMIT 10;
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename = 'student_tasks';
