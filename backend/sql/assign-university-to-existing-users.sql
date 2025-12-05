-- Assign CVSU-Bacoor Campus to all existing students and advisors
-- Run this in your Supabase SQL Editor

-- First, get the CVSU-BC university ID
DO $$
DECLARE
    cvsu_id uuid;
BEGIN
    -- Get CVSU-BC university ID
    SELECT id INTO cvsu_id
    FROM universities
    WHERE code = 'CVSU-BC'
    LIMIT 1;
    
    -- Update all students without university
    UPDATE users
    SET university_id = cvsu_id
    WHERE role = 'student'
      AND university_id IS NULL;
    
    -- Update all advisors without university
    UPDATE users
    SET university_id = cvsu_id
    WHERE role = 'advisor'
      AND university_id IS NULL;
      
    RAISE NOTICE 'Successfully assigned CVSU-BC to all students and advisors';
END $$;

-- Verify the update
SELECT 
    role,
    COUNT(*) as total,
    COUNT(university_id) as with_university,
    COUNT(*) - COUNT(university_id) as without_university
FROM users
WHERE role IN ('student', 'advisor')
GROUP BY role;
