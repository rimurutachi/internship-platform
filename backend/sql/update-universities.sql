-- ============================================================
-- Universities Table Update Script
-- ============================================================
-- Purpose: Update universities table to contain only one university
-- Target: "Cavite State University - Bacoor City Campus" (CVSU-BC)
-- 
-- Table Structure:
-- - id: uuid (Primary Key, auto-generated)
-- - name: text (NOT NULL)
-- - code: text (UNIQUE)
-- - address: text
-- - contact_info: jsonb (default '{}')
-- - created_at: timestamp with time zone (default now())
-- ============================================================

-- ============================================================
-- OPTION 1: SAFE MIGRATION (Recommended if you have existing data)
-- ============================================================

-- Step 1: Check current universities
SELECT id, name, code FROM universities ORDER BY created_at;

-- Step 2: Insert the new CVSU-BC university (if not exists)
INSERT INTO universities (name, code, address, contact_info)
VALUES (
  'Cavite State University - Bacoor City Campus',
  'CVSU-BC',
  'Niog II, Bacoor City, Cavite 4102',
  '{
    "email": "cvsu-bacoor@cvsu.edu.ph",
    "phone": "(046) 476-5029",
    "website": "https://cvsu.edu.ph"
  }'::jsonb
)
ON CONFLICT (code) DO NOTHING
RETURNING id, name, code;

-- Step 3: Get the CVSU-BC university ID
-- (Save this ID - you'll need it for the next step)
SELECT id, name, code FROM universities WHERE code = 'CVSU-BC';

-- Step 4: Update all existing users to use CVSU-BC
-- (Only affects students and advisors who have university_id set)
UPDATE users 
SET university_id = (SELECT id FROM universities WHERE code = 'CVSU-BC')
WHERE role IN ('student', 'advisor') 
  AND university_id IS NOT NULL
  AND university_id != (SELECT id FROM universities WHERE code = 'CVSU-BC');

-- Step 5: Check how many users were updated
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(DISTINCT university_id) as unique_universities
FROM users 
WHERE role IN ('student', 'advisor')
GROUP BY role;

-- Step 6: Delete old universities (keep only CVSU-BC)
DELETE FROM universities WHERE code != 'CVSU-BC' OR code IS NULL;

-- Step 7: Verify final state
SELECT * FROM universities;

-- Step 8: Verify user assignments
SELECT 
  u.role,
  COUNT(*) as user_count,
  uni.name as university_name,
  uni.code as university_code
FROM users u
LEFT JOIN universities uni ON u.university_id = uni.id
WHERE u.role IN ('student', 'advisor')
GROUP BY u.role, uni.name, uni.code;


-- ============================================================
-- OPTION 2: FRESH START (If you want to clear and start fresh)
-- ============================================================

-- WARNING: This will delete ALL existing universities and create only CVSU-BC
-- Use this ONLY if you're starting fresh or have no important data

-- Step 1: Clear existing universities
-- DELETE FROM universities;

-- Step 2: Insert CVSU-BC as the only university
-- INSERT INTO universities (name, code, address, contact_info)
-- VALUES (
--   'Cavite State University - Bacoor City Campus',
--   'CVSU-BC',
--   'Niog II, Bacoor City, Cavite 4102',
--   '{
--     "email": "cvsu-bacoor@cvsu.edu.ph",
--     "phone": "(046) 476-5029",
--     "website": "https://cvsu.edu.ph"
--   }'::jsonb
-- );

-- Step 3: Verify
-- SELECT * FROM universities;


-- ============================================================
-- MAINTENANCE QUERIES (For future reference)
-- ============================================================

-- Check all students/advisors without university assignment
-- SELECT id, email, name, role 
-- FROM users 
-- WHERE role IN ('student', 'advisor') AND university_id IS NULL;

-- Assign CVSU-BC to users without university
-- UPDATE users 
-- SET university_id = (SELECT id FROM universities WHERE code = 'CVSU-BC')
-- WHERE role IN ('student', 'advisor') AND university_id IS NULL;

-- Get statistics
-- SELECT 
--   'Total Universities' as metric, 
--   COUNT(*)::text as value 
-- FROM universities
-- UNION ALL
-- SELECT 
--   'Students with University', 
--   COUNT(*)::text 
-- FROM users 
-- WHERE role = 'student' AND university_id IS NOT NULL
-- UNION ALL
-- SELECT 
--   'Advisors with University', 
--   COUNT(*)::text 
-- FROM users 
-- WHERE role = 'advisor' AND university_id IS NOT NULL;
