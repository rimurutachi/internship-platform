-- Fix advisor_id typo in internships table
-- The internships table has advisor_id with typos that don't match any user in users table
-- This script corrects all advisor_id values to assign internships to Alvin Catalo

-- Step 1: Verify the problem - check how many internships have the wrong advisor_id
SELECT 
  COUNT(*) as broken_internships,
  advisor_id as wrong_advisor_id
FROM internships
WHERE advisor_id = 'cc7f40a3-0e14-4791-87c4-e2696b001ee5'
GROUP BY advisor_id;
-- Expected: 4 internships with this wrong ID

-- Step 2: Verify Alvin Catalo's correct ID
SELECT 
  id,
  email,
  first_name,
  last_name,
  role
FROM users
WHERE email = 'advisor1@cvsu.edu.ph';
-- Expected: cc7480a1-0e14-4791-87c4-62696b001ee5

-- Step 3: Fix all internships - assign to Alvin Catalo
UPDATE internships
SET 
  advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5',
  updated_at = NOW()
WHERE advisor_id = 'cc7f40a3-0e14-4791-87c4-e2696b001ee5';
-- This will update all 4 internships

-- Step 4: Verify the fix - check updated internships
SELECT 
  i.id,
  i.position,
  i.advisor_id,
  u.first_name || ' ' || u.last_name as advisor_name,
  u.email as advisor_email,
  s.first_name || ' ' || s.last_name as student_name
FROM internships i
LEFT JOIN users u ON i.advisor_id = u.id
LEFT JOIN users s ON i.student_id = s.id
WHERE i.advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5'
ORDER BY i.created_at DESC;
-- Expected: 4 internships now assigned to Alvin Catalo

-- Step 5: Verify no more orphaned advisor_ids
SELECT 
  COUNT(*) as orphaned_count
FROM internships i
LEFT JOIN users u ON i.advisor_id = u.id
WHERE u.id IS NULL;
-- Expected: 0 (no orphaned records)

-- Optional: If you want to split assignments between Alvin and Kelly later, you can run:
-- UPDATE internships
-- SET advisor_id = 'ece4d7ea-e39f-4146-b4fb-3381df305a3d', updated_at = NOW()
-- WHERE position = 'Data Analyst Intern'
--   AND student_id IN (SELECT id FROM users WHERE email = 'student6@cvsu.edu.ph');
