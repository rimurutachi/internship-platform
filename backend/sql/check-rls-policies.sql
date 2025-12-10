-- Check if Row Level Security (RLS) is blocking the queries
-- RLS policies can override direct queries from backend

-- Step 1: Check if RLS is enabled on internships table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'internships';

-- Step 2: List all RLS policies on internships table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'internships';

-- Step 3: Test query as if backend is running it (using service role key)
-- This simulates what the backend sees
SELECT 
  i.id,
  i.advisor_id,
  i.position,
  i.status,
  u.first_name || ' ' || u.last_name as student_name
FROM internships i
LEFT JOIN users u ON i.student_id = u.id
WHERE i.advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5';
-- Expected: 3 rows for Alvin Catalo

-- Step 4: Check if there are any views or functions that might interfere
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%internship%'
  AND routine_schema = 'public';
