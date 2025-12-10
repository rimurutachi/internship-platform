-- Comprehensive verification of advisor_id fix

-- Step 1: Check if OLD wrong advisor_id still exists
SELECT 
  'OLD WRONG ID' as status,
  COUNT(*) as count,
  advisor_id
FROM internships
WHERE advisor_id = 'cc7f40a3-0e14-4791-87c4-e2696b001ee5'
GROUP BY advisor_id;
-- Expected: 0 rows (the old ID should be gone)

-- Step 2: Check if NEW correct advisor_id exists
SELECT 
  'NEW CORRECT ID (Alvin)' as status,
  COUNT(*) as count,
  advisor_id
FROM internships
WHERE advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5'
GROUP BY advisor_id;
-- Expected: 4 rows (all internships should have Alvin's correct ID)

-- Step 3: Show ALL internships with their advisor details
SELECT 
  i.id as internship_id,
  i.position,
  i.advisor_id,
  u.email as advisor_email,
  u.first_name || ' ' || u.last_name as advisor_name,
  s.first_name || ' ' || s.last_name as student_name,
  s.email as student_email,
  i.status as internship_status
FROM internships i
LEFT JOIN users u ON i.advisor_id = u.id
LEFT JOIN users s ON i.student_id = s.id
ORDER BY i.created_at DESC;
-- This will show ALL internships with their current advisor assignments

-- Step 4: Check for ANY advisor_ids that don't match users table
SELECT 
  'ORPHANED ADVISOR IDS' as issue,
  COUNT(*) as problematic_count,
  i.advisor_id as non_existent_advisor_id
FROM internships i
LEFT JOIN users u ON i.advisor_id = u.id
WHERE u.id IS NULL
GROUP BY i.advisor_id;
-- Expected: 0 rows (no orphaned IDs)

-- Step 5: List ALL distinct advisor_ids in internships table
SELECT DISTINCT
  i.advisor_id,
  u.first_name || ' ' || u.last_name as advisor_name,
  u.email as advisor_email,
  COUNT(i.id) as assigned_internships
FROM internships i
LEFT JOIN users u ON i.advisor_id = u.id
GROUP BY i.advisor_id, u.first_name, u.last_name, u.email
ORDER BY assigned_internships DESC;
-- This shows exactly which advisor_ids exist and how many internships each has
