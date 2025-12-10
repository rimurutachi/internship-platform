-- Debug query: Check internships and advisor assignments
-- Run this in Supabase SQL Editor to see the data

SELECT 
  i.id,
  i.position,
  i.status,
  i.start_date,
  i.end_date,
  i.progress,
  -- Student info
  us.id as student_id,
  us.email as student_email,
  us.first_name || ' ' || us.last_name as student_name,
  -- Advisor info
  ua.id as advisor_id,
  ua.email as advisor_email,
  ua.first_name || ' ' || ua.last_name as advisor_name,
  -- Supervisor info  
  uv.id as supervisor_id,
  uv.email as supervisor_email,
  uv.first_name || ' ' || uv.last_name as supervisor_name,
  -- Company info
  c.id as company_id,
  c.name as company_name
FROM internships i
LEFT JOIN users us ON i.student_id = us.id
LEFT JOIN users ua ON i.advisor_id = ua.id
LEFT JOIN users uv ON i.supervisor_id = uv.id
LEFT JOIN companies c ON i.company_id = c.id
ORDER BY i.created_at DESC;

-- Check if Alvin Catalo exists and his ID
SELECT 
  id,
  email,
  first_name,
  last_name,
  raw_app_meta_data->>'role' as auth_role,
  raw_user_meta_data->>'role' as user_role
FROM auth.users
WHERE email LIKE '%catalo%' OR first_name LIKE '%Alvin%';

-- Also check users table
SELECT 
  id,
  email,
  first_name,
  last_name,
  profile_data
FROM users
WHERE email LIKE '%catalo%' OR first_name LIKE '%Alvin%';
