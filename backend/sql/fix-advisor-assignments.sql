-- STEP 1: Check what's in the internships table
SELECT 
  i.id,
  i.position,
  i.status,
  -- Current advisor_id
  i.advisor_id as current_advisor_id,
  -- Advisor info (if exists)
  ua.email as advisor_email,
  ua.first_name || ' ' || ua.last_name as advisor_name,
  -- Student info
  us.email as student_email,
  us.first_name || ' ' || us.last_name as student_name
FROM internships i
LEFT JOIN users us ON i.student_id = us.id
LEFT JOIN users ua ON i.advisor_id = ua.id
ORDER BY i.created_at DESC;

-- STEP 2: Check Alvin Catalo's actual ID
SELECT 
  id as alvin_id,
  email,
  first_name,
  last_name
FROM users
WHERE first_name ILIKE '%Alvin%' AND last_name ILIKE '%Catalo%';

-- STEP 3: If Alvin's ID doesn't match, UPDATE the internships
-- First check what the correct ID should be:
SELECT 
  'Expected advisor_id: cc7480a1-0e14-4791-87c4-62696b001ee5' as note,
  'Actual advisor IDs in internships:' as check_result,
  DISTINCT i.advisor_id,
  COUNT(*) as count
FROM internships i
GROUP BY i.advisor_id;

-- STEP 4: Fix the advisor_id if needed
-- ONLY RUN THIS if Step 2 confirms Alvin's ID is cc7480a1-0e14-4791-87c4-62696b001ee5
-- AND Step 3 shows different advisor_ids in the internships table

-- UPDATE internships
-- SET advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5'
-- WHERE advisor_id != 'cc7480a1-0e14-4791-87c4-62696b001ee5'
--   AND status IN ('active', 'pending', 'completed');

-- STEP 5: Verify the fix
-- SELECT 
--   COUNT(*) as internships_with_alvin_as_advisor
-- FROM internships
-- WHERE advisor_id = 'cc7480a1-0e14-4791-87c4-62696b001ee5';
